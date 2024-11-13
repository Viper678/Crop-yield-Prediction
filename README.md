# Crop Yield Prediction Application

This application predicts crop yield based on historical data and NDVI (Normalized Difference Vegetation Index) values. It uses a machine learning model and geospatial data to provide accurate crop yield forecasts for different districts and seasons.

## Features

- **Predict Crop Yield**: The app predicts crop yield based on the selected district, crop type, season, and area using a trained machine learning model.
- **NDVI Calculation**: It calculates NDVI using MODIS satellite data for the specified district and season. NDVI is used as an indicator of vegetation health and can help estimate crop yield.
- **Geospatial Visualization**: The app provides a map visualization of the NDVI over the district during the selected season.

## Setup

Follow these steps to set up the application on your local machine:

1. **Install Python 3.10** (if not already installed):
   - You can download Python 3.10 from the official [Python website](https://www.python.org/downloads/release/python-3100/).

2. **Install `pipenv`** (if not already installed):
   - Install `pipenv` using pip:
     ```bash
     pip install pipenv
     ```

3. **Create a Virtual Environment and Install Dependencies**:
   - Navigate to your project directory and install the dependencies using `pipenv`:
     ```bash
     pipenv install --python 3.10
     ```
   - This will create a virtual environment and install all the necessary dependencies as defined in the `Pipfile`.

4. **Activate the Virtual Environment**:
   - Once the installation is complete, activate the virtual environment:
     ```bash
     pipenv shell
     ```

5. **Google Earth Engine Setup**:
   - The app uses Google Earth Engine (GEE) for NDVI calculations. You need to authenticate and initialize the GEE API.
   - Create a GEE account if you don’t have one at [https://signup.earthengine.google.com/](https://signup.earthengine.google.com/).
   - Authenticate using the following command:
     ```bash
     earthengine authenticate
     ```

6. **Model Files**:
   - You need to have the following model and encoder files:
     - `crop_yield_model_2014.pkl`: The trained machine learning model for crop yield prediction.
     - `le_district_2014.pkl`: Label encoder for district names.
     - `le_crop_2014.pkl`: Label encoder for crop names.
     - `le_season_2014.pkl`: Label encoder for season names.

   These files should be placed in the same directory as `app.py`.

7. **NDVI Cache**:
   - The app uses a cache file (`ndvi_cache.json`) to store previously calculated NDVI values to avoid recalculating them each time. Ensure this file is present in the directory or will be created automatically.

## Running the Application

Once everything is set up, you can run the application with the following command:

```bash
python app.py
```

This will start a local development server. You can access the app by navigating to `http://127.0.0.1:5000/` in your web browser.

## Usage

1. Open the app in your browser.
2. Select a district, crop type, season, and input the area for which you want to predict the crop yield.
3. The app will calculate the NDVI value for the given district and season and predict the crop yield based on the selected inputs.
4. The result will display the predicted crop yield, NDVI value, and a URL to visualize the NDVI map for the district.
