import ee
import geemap
from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import os
import json
from datetime import datetime

# Initialize Earth Engine
try:
    ee.Initialize(project='peppy-vertex-436106-b6')
except Exception as e:
    ee.Authenticate()
    ee.Initialize(project='peppy-vertex-436106-b6')

# Load the saved model and encoders
model = joblib.load('crop_yield_model_2014.pkl')
le_district = joblib.load('le_district_2014.pkl')
le_crop = joblib.load('le_crop_2014.pkl')
le_season = joblib.load('le_season_2014.pkl')

app = Flask(__name__, static_folder='static', static_url_path='/static')

# Path for the NDVI cache file
NDVI_CACHE_FILE = 'ndvi_cache.json'

def load_ndvi_cache():
    if os.path.exists(NDVI_CACHE_FILE):
        with open(NDVI_CACHE_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_ndvi_cache(cache):
    with open(NDVI_CACHE_FILE, 'w') as f:
        json.dump(cache, f)

ndvi_cache = load_ndvi_cache()

def get_district_center(district_name):
    district_feature = ee.FeatureCollection('projects/peppy-vertex-436106-b6/assets/DISTRICT_BOUNDARY') \
        .filter(ee.Filter.eq('District', district_name)) \
        .first()
    
    if district_feature:
        centroid = district_feature.geometry().centroid()
        coords = centroid.coordinates().getInfo()
        return coords[1], coords[0]  # Return as [lat, lon]
    else:
        return 20.5937, 78.9629

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/results')
def results():
    return render_template('results.html')

@app.route('/predict', methods=['POST'])
def predict():
    if request.method == 'POST':
        district_name = request.form['district_name'].strip()
        crop_name = request.form['crop_name'].strip()
        season_name = request.form['season_name'].strip()
        area = float(request.form['area'])

        ndvi, visualization_url = get_or_calculate_ndvi(district_name, season_name)
        prediction = predict_yield(district_name, crop_name, season_name, area, ndvi)
        lat, lon = get_district_center(district_name)

        return jsonify({
            'prediction': f'Predicted yield: {prediction:.2f} tons',
            'ndvi': f'Calculated NDVI: {ndvi:.4f}',
            'visualization_url': visualization_url,
            'district_lat': lat,
            'district_lon': lon
        })

def get_or_calculate_ndvi(district_name, season_name):
    cache_key = f"{district_name}_{season_name}"
    if cache_key in ndvi_cache:
        return ndvi_cache[cache_key]['ndvi'], ndvi_cache[cache_key]['visualization_url']
    else:
        ndvi, visualization_url = calculate_ndvi(district_name, season_name)
        ndvi_cache[cache_key] = {'ndvi': ndvi, 'visualization_url': visualization_url}
        save_ndvi_cache(ndvi_cache)
        return ndvi, visualization_url

def calculate_ndvi(district_name, season_name):
    district_geometry = ee.FeatureCollection('projects/peppy-vertex-436106-b6/assets/DISTRICT_BOUNDARY') \
        .filter(ee.Filter.eq('District', district_name)) \
        .first() \
        .geometry()

    if season_name.lower() == 'kharif':
        start_date = '2014-06-01'
        end_date = '2014-10-31'
    elif season_name.lower() == 'rabi':
        start_date = '2014-11-01'
        end_date = '2015-03-31'
    else:
        start_date = '2014-01-01'
        end_date = '2014-12-31'

    modis_ndvi = ee.ImageCollection('MODIS/006/MOD13Q1') \
        .filterDate(start_date, end_date) \
        .filterBounds(district_geometry) \
        .select('NDVI')

    mean_ndvi = modis_ndvi.mean().clip(district_geometry)
    ndvi_value = mean_ndvi.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=district_geometry,
        scale=250
    ).get('NDVI').getInfo()

    vis_params = {'min': -2000, 'max': 10000, 'palette': ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901', '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01', '012E01', '011D01', '011301']}
    map_id_dict = mean_ndvi.getMapId(vis_params)
    visualization_url = map_id_dict['tile_fetcher'].url_format

    return ndvi_value / 10000, visualization_url

def predict_yield(district_name, crop_name, season_name, area, ndvi):
    district_encoded = le_district.transform([district_name])[0]
    crop_encoded = le_crop.transform([crop_name])[0]
    season_encoded = le_season.transform([season_name])[0]
    
    input_data = pd.DataFrame({
        'District_Encoded': [district_encoded],
        'Crop_Encoded': [crop_encoded],
        'Season_Encoded': [season_encoded],
        'Area': [area],
        'mean_ndvi': [ndvi]
    })
    
    predicted_yield = model.predict(input_data)
    return predicted_yield[0]

if __name__ == "__main__":
    app.run(debug=True)