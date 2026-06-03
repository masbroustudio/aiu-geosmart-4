#!/usr/bin/env python3
"""Build Notebook 06: Recommendation Engine & What-If Simulation."""
import nbformat as nbf
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from nb06_cells import build_cells

nb = nbf.v4.new_notebook()
nb.metadata = {
    "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
    "language_info": {"name": "python", "version": "3.9.0"}
}
nb.cells = build_cells()

output_path = os.path.join(os.path.dirname(__file__), '..', 'notebooks', '06_Recommendation_WhatIf.ipynb')
with open(output_path, 'w') as f:
    nbf.write(nb, f)

print(f"Notebook written: {output_path} ({len(nb.cells)} cells)")
