
var selectedDistrict = districts.filter(ee.Filter.eq('District', 'THANE')).first();

// Get the geometry of the selected district to use as AOI
var aoi =selectedDistrict.geometry();
print('aoi is: ', aoi);

// Time period for data extraction
var startDate = '2014-01-01';
var endDate = '2014-12-31';

// Load the MODIS Surface Reflectance dataset for NDVI
var modisSR = ee.ImageCollection('MODIS/061/MOD13Q1')
  .filterDate(startDate, endDate)
  .filterBounds(aoi);

// Function to calculate NDVI
var calculateNDVI = function(image) {
  var ndvi = image.select('NDVI');
  return image.addBands(ndvi).clip(aoi);
};

//function to clip required area
var cliplearningarea = function(image){
  return image.clip(image_reprojected);
};

var calculate_meanNDVI = function(image){
  var meanNDVI = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: image_reprojected,
    scale: 500,
    maxPixels: 1e9
  }).get('NDVI');
  
  return image.set('mean_ndvi', meanNDVI);
};

var predictedcropyield = function(image){
    var ndvi = image.select('NDVI');
    var fpar_eq = image.select('sur_refl_b01').multiply(0.0001);
    var predictedYield = ndvi.multiply(0.5).add(fpar_eq.multiply(0.3)).add(0.2);
    return predictedYield;
};

var calculate_meancropyield = function(image){
  var meancropyield = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: image_reprojected,
    scale: 250,
    maxPixels: 1e9
  }).get('NDVI');
  
  return image.set('mean_cropyield', meancropyield);
};

var modisprojection = modisSR.first().projection();

var image_reprojected = aoi;

var clipmodis = modisSR.map(cliplearningarea);

var modiswithNDVI = clipmodis.map(calculateNDVI);

var modiswithmeanNDVI = modiswithNDVI.map(calculate_meanNDVI);

var cropyieldpred = modiswithNDVI.map(predictedcropyield);

var cropyieldwithmean = cropyieldpred.map(calculate_meancropyield);

//print mean predicted crop yield
print('mean crop yield: ',cropyieldwithmean.aggregate_mean('mean_cropyield'));

//print mean NDVI values
var temp = modiswithmeanNDVI.aggregate_array('mean_ndvi');
print('mean ndvi array is :', temp);

//calculate overall meanNDVI
var overallmeanNDVI = ee.Number(temp.reduce(ee.Reducer.mean()));

//print overall meanNDVI
print('overall mean ndvi is :', overallmeanNDVI)

//visualize the study area
Map.centerObject(image_reprojected, 10);
Map.addLayer(image_reprojected, {color : 'blue'}, 'Study Area');

//visualize NDVI
var ndviVis = {
  min: -2000,
  max: 10000,
  palette: [
    'ffffff', 'ce7e45', 'df923d', 'f1b555', 'fcd163', '99b718', '74a901',
    '66a000', '529400', '3e8601', '207401', '056201', '004c00', '023b01',
    '012e01', '011d01', '011301'
  ],
};

// Select NDVI band and apply visualization
Map.addLayer(modiswithNDVI.select('NDVI'), ndviVis, 'NDVI Visualization');

//visualized predicted crop yield
// Visualize predicted crop yield
var cropYieldVis = {min: 0.26893767441860467, max: 0.697946046511628, palette: ['ff0000', 'ffd758', '37ab3e', '53ff3d','#006400']};
Map.addLayer(cropyieldwithmean, cropYieldVis, 'Predicted Crop Yield');

//create a legend for predicted crop yield
var legendCropyield =ui.Panel({
  style:{
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

var legendTitle = ui.Label({
  value : 'Predicted crop yield',
  style: {
    fontWeight: 'bold',
    fontSize:'18px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});
legendCropyield.add(legendTitle);

//create the color pallete for the legend
var palette = ['ff0000', 'ffd758', '37ab3e', '53ff30', '185a1f'];
var min = 0.26893767441860467;
var max = 0.697946046511628;
var numClasses = palette.length;

//Labels with RGB code for each color
var labels = [
    {class: 0, color: '#ff0000', rgb: 'RGB: 255, 0, 0'},
    {class: 1, color: '#ffd758', rgb: 'RGB: 255, 215, 88'},
    {class: 2, color: '#37ab3e', rgb: 'RGB: 55, 171, 62'},
    {class: 3, color: '#53ff30', rgb: 'RGB: 83, 255, 48'},
    {class: 4, color: '#185a1f', rgb: 'RGB: 24, 90, 31'}
];

// // Define the time period
// var startDate = '2014-01-01';
// var endDate = '2014-12-31';

// // Load the MODIS NDVI dataset
// var modisNDVI = ee.ImageCollection('MODIS/061/MOD13Q1')
//   .select('NDVI')
//   .filterDate(startDate, endDate);

// // Function to calculate mean NDVI for a district
// var calculateMeanNDVI = function(feature) {
//   var districtGeometry = feature.geometry();
  
//   var meanNDVI = modisNDVI.mean().reduceRegion({
//     reducer: ee.Reducer.mean(),
//     geometry: districtGeometry,
//     scale: 250,
//     maxPixels: 1e9
//   });
  
//   return feature.set('mean_ndvi', meanNDVI.get('NDVI'));
// };

// // Calculate mean NDVI for all districts
// var districtsWithNDVI = districts.map(calculateMeanNDVI);

// // Export the results
// Export.table.toDrive({
//   collection: districtsWithNDVI,
//   description: 'Maharashtra_Districts_Yearly_NDVI_2014',
//   fileFormat: 'CSV'
// });

// // Print the first few results to console for verification
// print(districtsWithNDVI.limit(5));

// // Define the time period
// var startDate = '2010-12-01';
// var endDate = '2011-03-01';

// // Load the MODIS NDVI dataset
// var modisNDVI = ee.ImageCollection('MODIS/061/MOD13Q1')
//   .select('NDVI')
//   .filterDate(startDate, endDate);

// // Function to calculate mean NDVI for a district
// var calculateMeanNDVI = function(feature) {
//   var districtGeometry = feature.geometry();
  
//   var meanNDVI = modisNDVI.mean().reduceRegion({
//     reducer: ee.Reducer.mean(),
//     geometry: districtGeometry,
//     scale: 250,
//     maxPixels: 1e9
//   });
  
//   // Return a new feature with only 'State', 'District', and 'mean_ndvi'
//   return ee.Feature(null, {
//     'State': feature.get('STATE'),
//     'District': feature.get('District'),
//     'mean_ndvi': meanNDVI.get('NDVI'),
//     'Season': 'Winter'
//   });
// };

// // Calculate mean NDVI for all districts
// var districtsWithNDVI = districts.map(calculateMeanNDVI);

// // Export the results, specifying only the needed properties
// Export.table.toDrive({
//   collection: districtsWithNDVI,
//   description: 'Maharashtra_Districts_Yearly_NDVI_2011_Winter',
//   fileFormat: 'CSV',
//   selectors: ['State', 'District', 'mean_ndvi','Season'] // Specify the fields to include in the CSV
// });

// // Print the first few results to console for verification
// print(districtsWithNDVI.limit(5));
