import json
import glob
import os

for nb_file in glob.glob(r'C:\dev\aiu-geosmart\ml\notebooks\0[4-8]_*.ipynb'):
    with open(nb_file, 'r', encoding='utf-8') as f:
        nb = json.load(f)
    
    for cell in nb['cells']:
        if cell['cell_type'] == 'code':
            source_list = cell['source'] if isinstance(cell['source'], list) else [cell['source']]
            source = ''.join(source_list)
            new_source = source.replace("'../docs/", "'C:/dev/aiu-geosmart/docs/").replace("'./temp/", "'C:/dev/aiu-geosmart/ml/temp/")
            cell['source'] = new_source.split('\n') if '\n' in new_source else [new_source]
    
    with open(nb_file, 'w', encoding='utf-8') as f:
        json.dump(nb, f)
    
    print(f"Fixed {os.path.basename(nb_file)}")
