# 11 — Implementation Cookbook: Chat, RAG & Azure OpenAI

**Version:** 4.0  
**Last Updated:** 2026-06-02  
**Status:** Production Implementation Guide

---

## Table of Contents

1. [Chat Endpoint Implementation](#chat-endpoint)
2. [RAG Knowledge Base Setup](#rag-setup)
3. [Azure OpenAI Integration](#openai-integration)
4. [Streaming Responses (SSE)](#streaming-sse)
5. [SHAP Feature Importance Integration](#shap-integration)
6. [Error Handling & Debugging](#error-handling)
7. [Testing Guide](#testing)

---

## Chat Endpoint Implementation

### Overview

```
User Query → FastAPI /chat → Azure AI Search (retrieval) → Azure OpenAI (generation) → Response
```

### FastAPI Chat Handler

**File: `backend/app/routes/chat.py`**

```python
import asyncio
import json
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import logging

# Azure SDK imports
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient, SearchIndexingBufferedSender
from azure.search.documents.models import VectorQuery
from openai import AsyncAzureOpenAI

from app.auth import verify_api_key, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["chat"])

# ===========================
# Pydantic Models
# ===========================

class ChatRequest(BaseModel):
    query: str
    umkm_id: str
    user_type: str = "bank"  # bank, government, investor
    include_sources: bool = True
    max_tokens: int = 1000

class ChatResponse(BaseModel):
    query: str
    answer: str
    confidence: float
    sources: list[str]
    tokens_used: int
    model: str = "gpt-4-turbo"

# ===========================
# Initialize Azure clients
# ===========================

import os
from functools import lru_cache

@lru_cache()
def get_search_client():
    """Initialize Azure AI Search client"""
    return SearchClient(
        endpoint=os.getenv("AI_SEARCH_ENDPOINT"),
        index_name=os.getenv("AI_SEARCH_INDEX_NAME", "geoumkm_knowledge_base"),
        credential=AzureKeyCredential(os.getenv("AI_SEARCH_API_KEY"))
    )

@lru_cache()
def get_openai_client():
    """Initialize Azure OpenAI client"""
    return AsyncAzureOpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        api_version="2024-02-15",
        azure_endpoint=os.getenv("OPENAI_ENDPOINT")
    )

# ===========================
# Endpoints
# ===========================

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    x_api_key: str = Header(...),
    user_id: str = Depends(get_current_user)
):
    """
    Chat endpoint for natural language queries about UMKM credit scoring.
    
    Returns:
        ChatResponse with LLM-generated answer + source documents
    """
    try:
        # Verify API key
        verify_api_key(x_api_key)
        
        logger.info(f"Chat request from user {user_id}: {request.query[:100]}...")
        
        # Step 1: Retrieve relevant documents from knowledge base (RAG)
        documents = await retrieve_documents(request.query, request.umkm_id, limit=5)
        
        if not documents:
            return ChatResponse(
                query=request.query,
                answer="Sorry, I couldn't find relevant information about this UMKM.",
                confidence=0.0,
                sources=[],
                tokens_used=0
            )
        
        # Step 2: Build prompt with context
        system_prompt = build_system_prompt(request.user_type)
        context_text = format_documents(documents)
        user_prompt = f"""
        User query: {request.query}
        
        UMKM ID: {request.umkm_id}
        
        Relevant context from knowledge base:
        {context_text}
        
        Please provide a natural language explanation that:
        1. Directly answers the user's question
        2. References specific features or metrics when relevant
        3. Is appropriate for a {request.user_type} user
        4. Is concise (under {request.max_tokens} tokens)
        """
        
        # Step 3: Call Azure OpenAI with context
        client = get_openai_client()
        response = await client.chat.completions.create(
            model="gpt-4-turbo",  # Or specify deployment name
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=request.max_tokens,
            temperature=0.7,  # Balanced creativity
            top_p=0.95
        )
        
        answer = response.choices[0].message.content
        tokens_used = response.usage.total_tokens if response.usage else 0
        
        # Step 4: Extract source documents
        sources = [doc.get("name", "unknown") for doc in documents]
        
        # Step 5: Calculate confidence (based on relevance scores)
        avg_relevance = sum(doc.get("score", 0) for doc in documents) / len(documents)
        confidence = min(0.99, avg_relevance)
        
        logger.info(f"Chat response generated: {tokens_used} tokens, confidence: {confidence}")
        
        return ChatResponse(
            query=request.query,
            answer=answer,
            confidence=confidence,
            sources=sources if request.include_sources else [],
            tokens_used=tokens_used
        )
    
    except Exception as e:
        logger.error(f"Chat error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat processing error: {str(e)}")


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    x_api_key: str = Header(...),
    user_id: str = Depends(get_current_user)
):
    """
    Streaming chat endpoint - returns Server-Sent Events stream.
    
    Benefits:
    - Progressive display (user sees answer as it's generated)
    - Lower latency perception (first token appears quickly)
    - Better for longer responses
    """
    try:
        verify_api_key(x_api_key)
        
        logger.info(f"Chat stream request from user {user_id}")
        
        # Retrieve context (same as non-streaming)
        documents = await retrieve_documents(request.query, request.umkm_id, limit=5)
        
        if not documents:
            yield 'data: {"error": "No relevant documents found"}\n\n'
            return
        
        system_prompt = build_system_prompt(request.user_type)
        context_text = format_documents(documents)
        user_prompt = f"""
        User query: {request.query}
        UMKM ID: {request.umkm_id}
        Context: {context_text}
        """
        
        # OpenAI streaming
        client = get_openai_client()
        stream = await client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=request.max_tokens,
            temperature=0.7,
            stream=True
        )
        
        token_count = 0
        
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                token_count += 1
                data = {
                    "type": "token",
                    "content": chunk.choices[0].delta.content,
                    "token_count": token_count
                }
                yield f'data: {json.dumps(data)}\n\n'
                await asyncio.sleep(0)  # Allow other tasks to run
        
        # Send completion event
        sources = [doc.get("name", "unknown") for doc in documents]
        completion_data = {
            "type": "complete",
            "total_tokens": token_count,
            "sources": sources,
            "confidence": 0.85  # Could be more sophisticated
        }
        yield f'data: {json.dumps(completion_data)}\n\n'
    
    except Exception as e:
        logger.error(f"Chat stream error: {str(e)}")
        yield f'data: {{"error": "{str(e)}"}}\n\n'
    
    return StreamingResponse(streaming_generator(), media_type="text/event-stream")


# ===========================
# Helper Functions
# ===========================

async def retrieve_documents(
    query: str,
    umkm_id: str,
    limit: int = 5
) -> list[dict]:
    """
    Retrieve relevant documents from Azure AI Search.
    Uses semantic search (vector + keyword) for better relevance.
    """
    try:
        search_client = get_search_client()
        
        # Filter by UMKM ID first (exact match)
        filters = f"umkm_id eq '{umkm_id}'"
        
        # Semantic search
        results = search_client.search(
            search_text=query,
            filter=filters,
            query_type="semantic",
            query_language="en-us",
            semantic_configuration_name="default",
            top=limit,
            include_total_count=True
        )
        
        documents = []
        async for result in results:
            documents.append({
                "name": result.get("name", ""),
                "content": result.get("content", ""),
                "score": result.get("score", 0),
                "feature_importance": result.get("feature_importance", 0)
            })
        
        logger.info(f"Retrieved {len(documents)} documents for query: {query[:50]}")
        return documents
    
    except Exception as e:
        logger.error(f"Document retrieval error: {str(e)}")
        return []


def build_system_prompt(user_type: str) -> str:
    """Build role-specific system prompt for LLM"""
    prompts = {
        "bank": """You are a credit risk analyst assistant for a bank. 
        Your role is to explain credit scores and risk factors in terms that help 
        loan officers make decisions. Be concise and factual.""",
        
        "government": """You are a policy analyst assistant for government. 
        Your role is to explain MSME credit patterns in terms that help policymakers 
        understand market dynamics and design support programs. Focus on aggregate trends.""",
        
        "investor": """You are an investment analyst assistant. 
        Your role is to identify investment opportunities in MSMEs. 
        Highlight growth potential, market segmentation, and portfolio diversity."""
    }
    
    return prompts.get(user_type, prompts["bank"])


def format_documents(documents: list[dict]) -> str:
    """Format retrieved documents as readable context for LLM"""
    formatted = []
    for i, doc in enumerate(documents, 1):
        formatted.append(f"""
        [{i}] {doc.get('name', 'Document')}
        Content: {doc.get('content', '')}
        Relevance Score: {doc.get('score', 0):.2f}
        """)
    return "\n".join(formatted)


# ===========================
# Example curl command
# ===========================

"""
curl -X POST https://fa-geoumkm-api.azurewebsites.net/api/v1/chat \\
  -H "X-API-Key: sk_live_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "Why is this UMKM at high credit risk?",
    "umkm_id": "U12345",
    "user_type": "bank",
    "include_sources": true,
    "max_tokens": 500
  }'

Response:
{
  "query": "Why is this UMKM at high credit risk?",
  "answer": "UMKM_U12345 has high credit risk (probability of default: 0.18) due to three main factors: (1) Limited credit history in our database (only 8 months), (2) Revenue volatility with 35% month-to-month fluctuation, and (3) Location in emerging market segment. However, positive indicators include strong inventory turnover (45 days) and growing customer base.",
  "confidence": 0.87,
  "sources": ["feature_importance_revenue", "cluster_profile_c3", "audit_trail_u12345"],
  "tokens_used": 156,
  "model": "gpt-4-turbo"
}
"""
```

---

## RAG Knowledge Base Setup

### Step 1: Extract SHAP Feature Importance

**File: `notebooks/07-llm-rag-preparation.ipynb`**

```python
import shap
import pandas as pd
import numpy as np

# Train model (from 05-model-training.ipynb)
model = xgb.Booster(model_file='models/credit_risk_model.json')
X_test = pd.read_csv('data/processed/X_test.csv')

# Generate SHAP values (explains feature importance)
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)  # Shape: (n_samples, n_features)

# Aggregate feature importance across all test samples
mean_abs_shap = np.abs(shap_values).mean(axis=0)
feature_importance_df = pd.DataFrame({
    'feature': X_test.columns,
    'shap_importance': mean_abs_shap,
    'rank': range(1, len(X_test.columns) + 1)
}).sort_values('shap_importance', ascending=False)

print("Top 10 features by SHAP importance:")
print(feature_importance_df.head(10))

# Save for RAG indexing
feature_importance_df.to_json('artifacts/feature_importance_shap.json', orient='records')
```

**Output** (`feature_importance_shap.json`):
```json
[
  {
    "feature": "revenue_monthly_avg",
    "shap_importance": 0.245,
    "interpretation": "Average monthly revenue is the strongest predictor of credit risk. Higher revenue correlates with lower default probability."
  },
  {
    "feature": "months_in_operation",
    "shap_importance": 0.198,
    "interpretation": "Business maturity (months operating) significantly reduces risk. Established businesses (>24 months) show 60% lower default rates."
  },
  {
    "feature": "inventory_turnover_days",
    "shap_importance": 0.156,
    "interpretation": "Fast inventory turnover (lower days) indicates healthy cash flow. Turnover >60 days suggests potential liquidity issues."
  }
  // ... 31 more features
]
```

### Step 2: Index Knowledge Base to Azure AI Search

**File: `scripts/index_rag_knowledge_base.py`**

```python
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
import json
import pandas as pd

# Initialize Search client
search_client = SearchClient(
    endpoint="https://search-geoumkm.search.windows.net",
    index_name="geoumkm_knowledge_base",
    credential=AzureKeyCredential(os.getenv("AI_SEARCH_API_KEY"))
)

# ===== Index 1: Feature Importance =====

feature_importance = pd.read_json('artifacts/feature_importance_shap.json')

feature_docs = []
for idx, row in feature_importance.iterrows():
    feature_docs.append({
        "id": f"feature_{row['feature']}",
        "name": row['feature'],
        "category": "feature_importance",
        "content": f"""
        Feature: {row['feature']}
        SHAP Importance Score: {row['shap_importance']:.3f}
        Rank: {idx + 1} out of 34 features
        Interpretation: {row['interpretation']}
        """,
        "importance_score": row['shap_importance'],
        "umkm_id": "*"  # Applies to all UMKMs
    })

# Upload to index
search_client.upload_documents(feature_docs)
print(f"Indexed {len(feature_docs)} feature importance documents")


# ===== Index 2: Cluster Profiles =====

cluster_profiles = [
    {
        "id": "cluster_1",
        "name": "High-Growth Tech Startups",
        "category": "cluster_profile",
        "content": """
        Cluster Profile: High-Growth Tech Startups
        Average probability of default: 0.12 (LOW RISK)
        Characteristics:
        - Revenue growth: 40-60% annually
        - Digital-savvy founders
        - Located in major urban centers
        - Tech/e-commerce/fintech sectors
        - High customer acquisition cost but strong retention
        
        Investment Recommendation: FAVORABLE - strong growth potential
        Policy Recommendation: Provide tech accelerator support and preferential rates
        """,
        "default_probability": 0.12,
        "umkm_id": "*",
        "member_count": 245
    },
    {
        "id": "cluster_2",
        "name": "Traditional Retail (Stable)",
        "category": "cluster_profile",
        "content": """
        Cluster Profile: Traditional Retail (Stable)
        Average probability of default: 0.18 (MEDIUM RISK)
        Characteristics:
        - Consistent but moderate revenue
        - Traditional retail/F&B businesses
        - Owner-operated, 5-15 employees
        - Stable customer base
        - Lower growth but reliable cash flow
        
        Investment Recommendation: MODERATE - stable but limited upside
        Policy Recommendation: Microfinance programs, inventory financing
        """,
        "default_probability": 0.18,
        "umkm_id": "*",
        "member_count": 3420
    },
    # ... more clusters
]

search_client.upload_documents(cluster_profiles)
print(f"Indexed {len(cluster_profiles)} cluster profile documents")


# ===== Index 3: Model Metrics =====

model_metrics = {
    "id": "model_credit_risk_v4",
    "name": "Credit Risk Model v4.0",
    "category": "model_metrics",
    "content": """
    Model: XGBoost Credit Risk Prediction (v4.0)
    
    Performance Metrics (on 2000 test UMKMs):
    - Accuracy: 0.78 (78% of decisions correct)
    - AUC-ROC: 0.82 (excellent discrimination between default/non-default)
    - Precision: 0.72 (of flagged high-risk, 72% actually defaulted)
    - Recall: 0.81 (captured 81% of actual defaulters)
    - F1 Score: 0.76
    
    Best for: Bank credit decisions (good balance of risk vs missed opportunities)
    
    Feature Count: 34 engineered features
    Training Data: 10,000 historical UMKM records
    Training Date: 2026-03-15
    """,
    "accuracy": 0.78,
    "auc_roc": 0.82,
    "umkm_id": "*"
}

search_client.upload_documents([model_metrics])
print("Indexed model metrics")
```

### Step 3: Test RAG Retrieval

```python
# Query test
query = "Why is revenue important for credit scoring?"

results = search_client.search(
    search_text=query,
    query_type="semantic",
    top=5
)

print("RAG Retrieval Results:")
for result in results:
    print(f"- {result['name']}: {result['score']:.2f}")
    print(f"  {result['content'][:200]}...\n")
```

---

## Azure OpenAI Integration

### Configuration

**File: `backend/config/openai_config.py`**

```python
import os
from typing import Optional

class OpenAIConfig:
    """Azure OpenAI configuration"""
    
    API_KEY = os.getenv("OPENAI_API_KEY")
    ENDPOINT = os.getenv("OPENAI_ENDPOINT")
    API_VERSION = "2024-02-15"  # Latest stable version
    DEPLOYMENT_NAME = os.getenv("OPENAI_DEPLOYMENT_NAME", "gpt-4-turbo")
    MODEL_NAME = "gpt-4-turbo"
    
    # Context window (max tokens in prompt + response)
    MAX_TOKENS = 4096
    
    # Model capabilities
    SUPPORTS_FUNCTIONS = True
    SUPPORTS_VISION = False
    
    # Pricing (per 1M tokens)
    COST_INPUT_1M = 0.03    # \$0.03 per 1M input tokens
    COST_OUTPUT_1M = 0.06   # \$0.06 per 1M output tokens
    
    @classmethod
    def verify_config(cls):
        """Verify all required configs are set"""
        required = ['API_KEY', 'ENDPOINT', 'DEPLOYMENT_NAME']
        missing = [r for r in required if not getattr(cls, r)]
        if missing:
            raise ValueError(f"Missing OpenAI config: {missing}")


# Usage example
if __name__ == "__main__":
    OpenAIConfig.verify_config()
    print(f"✓ OpenAI configured: {OpenAIConfig.ENDPOINT}")
```

### Embedding Generation (for RAG)

```python
from openai import AzureOpenAI
import numpy as np

client = AzureOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    api_version="2024-02-15",
    azure_endpoint=os.getenv("OPENAI_ENDPOINT")
)

# Generate embedding for a feature description
feature_text = "Revenue is the most important feature predicting credit risk"

embedding_response = client.embeddings.create(
    input=feature_text,
    model="text-embedding-3-large"  # Or specify deployment name
)

embedding_vector = embedding_response.data[0].embedding
print(f"Embedding dimension: {len(embedding_vector)}")  # Usually 3072 or 1536
```

---

## Streaming Responses (SSE)

### Frontend JavaScript

**File: `frontend/src/utils/chatStream.ts`**

```typescript
export async function chatStream(
  query: string,
  umkmId: string,
  onChunk: (chunk: string) => void,
  onComplete: (metadata: any) => void
) {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/v1/chat/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': getApiKey()
      },
      body: JSON.stringify({
        query,
        umkm_id: umkmId,
        user_type: getUserType()
      })
    }
  );

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l);
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          
          if (data.type === 'token') {
            onChunk(data.content);  // Append to UI
          } else if (data.type === 'complete') {
            onComplete(data);  // Show sources, confidence
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Usage
const [answer, setAnswer] = useState('');

await chatStream(
  "Why is this UMKM risky?",
  "U12345",
  (chunk) => setAnswer(prev => prev + chunk),
  (meta) => console.log("Sources:", meta.sources)
);
```

---

## SHAP Feature Importance Integration

### Full Integration Example

```python
# Feature importance extracted from SHAP in Notebook 07
# Inserted into RAG knowledge base
# Retrieved in chat context
# LLM generates explanations

Example flow:
1. User asks: "Why is UMKM_U12345 high credit risk?"
2. Chat handler queries RAG with SHAP features
3. RAG returns: "revenue_monthly_avg, months_in_operation, inventory_turnover"
4. LLM gets context: "These features have SHAP importance scores of 0.245, 0.198, 0.156"
5. LLM generates: "This UMKM has high risk due to low monthly revenue (\$500), recent startup (2 months), and slow inventory turnover (90 days)"
```

---

## Error Handling & Debugging

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "No relevant documents found" | Empty RAG index | Run indexing script, check Search index health |
| "Token limit exceeded" | Response too long | Reduce max_tokens in request |
| "429 Rate Limited" | Too many OpenAI calls | Implement backoff + retry logic |
| "Search index not found" | Wrong index name | Verify AI_SEARCH_INDEX_NAME env var |

---

## Testing Guide

```python
# Unit test for chat endpoint
import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def client():
    from app.main import app
    return TestClient(app)

def test_chat_endpoint(client):
    response = client.post(
        "/api/v1/chat",
        headers={"X-API-Key": "test_key"},
        json={
            "query": "Test query",
            "umkm_id": "U12345",
            "user_type": "bank"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "confidence" in data
    assert data["confidence"] >= 0.0 and data["confidence"] <= 1.0
```

---

**Document Status:** Implementation v4.0  
**Created:** 2026-06-02  
**Owner:** Backend Engineering Team
