<!DOCTYPE html>
<html>
<head>
 <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
 <link rel="stylesheet" href="css/mainPage.css" />
 <link rel="stylesheet" href="css/slideout.css" />
 <!--jQuery-->
 <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script> 
 <script src='https://api.tiles.mapbox.com/mapbox-gl-js/v0.30.0/mapbox-gl.js'></script>
 <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v0.30.0/mapbox-gl.css' rel='stylesheet' />
 
 <script src="https://code.jquery.com/jquery-1.12.2.js"></script>
 <script src="http://code.jquery.com/ui/1.11.4/jquery-ui.js"></script>
 <link href="http://code.jquery.com/ui/1.11.4/themes/ui-lightness/jquery-ui.css" rel="stylesheet">
 
 <script type="text/javascript" src="js/regression.js"></script>
 <script type="text/javascript" src="js/canvasjs.min.js"></script>
 
 <script src="http://code.highcharts.com/stock/highstock.js"></script>
 <script src="http://code.highcharts.com/stock/modules/exporting.js"></script>
 <meta name="csrf-token" content="{{ csrf_token() }}" />
 <script type="text/javascript">
  $.ajaxSetup({
    headers: {
      'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
  });
</script>

<script src="//rawgithub.com/phpepe/highcharts-regression/master/highcharts-regression.js"> </script>
<!--boostrap-->
<!-- Latest compiled and minified CSS -->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">
<!-- Latest compiled and minified JavaScript -->
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" integrity="sha384-0mSbJDEHialfmuBBQP6A4Qrprq5OVfW37PRR3j5ELqxss1yVqOtnepnHVP9aJ7xS" crossorigin="anonymous"></script>
<script type="text/javascript" src="js/fuse.js"></script>
<script type="text/javascript" src="js/GraphsController.js"></script>
</head>
<body>
  <div id="map-container">
    <!--search bar-->
    <div id="search-bar">
      <div class="input-group">
        <!-- <span class="input-group-btn">
          <button class="btn btn-default" id="search-button" type="button">Search</button>
        </span> -->
        <input type="text" class="form-control" placeholder="Search for..." id="search-input">
      </div>
    </div>
    <div id="top-map-buttons">
      <div id="map-type-menu">
        <input id='streets' type='radio' name='rtoggle' value='streets' checked="checked">
        <label for='streets'>Streets</label>
        <input id='satellite' type='radio' name='rtoggle' value='satellite'>
        <label for='satellite'>Satellite</label>
      </div>
      <div id="overlay-options-wrapper">
        <div id="overlay-options">
          <div id="overlay-options-toggles">
            <div class="overlay_toggle">
              <label>Data overlay</label>
              <input id = "overlay-toggle-button" type="checkbox" name="overlayToggle"/>
            </div>
            <div class="overlay-toggle">
              <label>Contour lines</label>
              <input id = "contour-toggle-button" type="checkbox" name="overlayToggle"/>
            </div>
          </div>
          <div id="overlay-slider"></div>
        </div>
      </div>
      <div id="reset-button">
        <button class="btn btn-primary-outline clickable-button">Reset</button>
      </div>
      <div id="information-button">                
        <button class="btn btn-primary-outline clickable-button">About</button>
      </div>
      @if (Auth::check()) 
      <div class="logged-in" id="login-logout-button">
       <button class="btn btn-primary-outline clickable-button">Logout</button>
     </div>
     @endif
   </div>    
   <div id="polygon-button-div">
    <button class="btn btn-primary-outline map-button clickable-button" data-toggle="tooltip" data-placement="right" title="Select rectangle" id="polygon-button">
      <img src="img/polygon.svg" alt="polygon.svg">
    </button>
  </div>
  <div id="color-scale">
    <div id="color-scale-text-div" class="rotate">
      LOS Velocity [cm/yr]
    </div>
    <div id="color-scale-and-values-container" class="clearfix">
      <div id="color-scale-picture-div"> 
        <img src="img/matlab_colorscale.jpg" alt="matlab_colorscale.jpg">
      </div>
      <div id="scale-values">
        <div id="left-scale-minimum">
          <div class="form-group">
            <input type="number" class="form-control" id="min-scale-value">
          </div>
        </div>
        <div id="right-scale-maximum">
          <div class="form-group">
            <input type="number" class="form-control" id="max-scale-value">
          </div>
        </div>
      </div>
    </div>
  </div>
  <div id="point-details"></div>
  <div class="wrap" id="area-attributes-div" title="Attributes">    
    <div class="top-right-buttons">
      <button type="button" class="close minimize" data-dismiss="modal" aria-label="Close" id="area-attributes-div-minimize-button"><span aria-hidden="true">&or;</span></button>
    </div>
    <div class="content">
        <div id="area-attributes-areaname-div">
        </div>
        <ul class="tab">
          <li><a href="#" id="details-tab-link" class="tablinks" onclick="goToTab(event, 'details-tab')">Details</a></li>
          <li><a href="#" class="tablinks" onclick="goToTab(event, 'downloads-tab')">Downloads</a></li>
          <li><a href="#" class="tablinks" onclick="goToTab(event, 'reference-tab')">Reference</a></li>
          <!-- <li><a href="#" class="tablinks" onclick="goToTab(event, 'links-tab')">Links</a></li> -->
        </ul>

        <div id="details-tab" class="tabcontent">
          <table class="table" id="area-attributes-table">
            <thead>              
            </thead>
            <tbody id="area-attributes-table-body">            
            </tbody>          
          </table>
        </div>

        <div id="downloads-tab" class="tabcontent">
          <p>Download to Unavco InSAR data products to be implemented.</p>
        </div>

        <div id="reference-tab" class="tabcontent">
          <p>Reference to the papers to be added.</p>
        </div>
        <!-- <div id="links-tab" class="tabcontent">
          <p>Extra links to be added.</p>
        </div> -->
      </div>
    </div>
  </div>
  <div class="wrap" id="charts" title="Displacement time-series">
    <div class="top-right-buttons">
      <button type="button" class="close close-button" data-dismiss="modal" aria-label="Close" id="graph-div-button"><span aria-hidden="true">&times;</span></button>
      <button type="button" class="close minimize" data-dismiss="modal" aria-label="Close" id="graph-div-minimize-button"><span aria-hidden="true">&or;</span></button>
    </div>
    <div class="content">
      <div class="chart-containers" id="chart-containers">
        <div id="chartContainer" class="side-item">
        </div>
        <div id="chartContainer2" class="side-item"></div>
      </div>
      <div id="graph-select-div">
        <div class="overlay_toggle">
          <div id="top-graph-focus-div">
            Select
            <input id = "top-graph-toggle-button" type="checkbox" name="overlayToggle"/>
          </div>
        </div>
        <div class="overlay_toggle">
          <div id="bottom-graph-focus-div">
            Select
            <input id = "bottom-graph-toggle-button" type="checkbox" name="overlayToggle"/>
          </div>
        </div>
      </div>
      <div id="map-options">
        <div class="overlay_toggle">
          <label>Second graph</label>
          <input id = "second-graph-toggle-button" type="checkbox" name="overlayToggle"/>          
        </div>
        <div class="overlay_toggle">
          <label>Line</label>
          <input id = "dot-toggle-button" type="checkbox" name="overlayToggle"/>          
        </div>
        <div class="overlay_toggle">
          <label>Regression</label>
          <input id = "regression-toggle-button" type="checkbox" name="overlayToggle"/>          
        </div>
        <div class="overlay_toggle">
          <label>Detrend</label>
          <input id = "detrend-toggle-button" type="checkbox" name="overlayToggle"/>          
        </div>
        <div id="download-as-text-button">
          <button class="btn btn-primary-outline clickable-button">Download as TXT</button>
        </div>
      </div>
    </div> 
  </div>
  <div class='wrap' id="select-area-wrap">
    <div class="top-right-buttons">
      <button type="button" class="close close-button" data-dismiss="modal" aria-label="Close" id="close-button"><span aria-hidden="true">&times;</span></button>
    </div>
    <div class='content'>                       
      <!-- table to select dataset from-->
      <table class='table' id='myTable'>
        <thead>
          <tr>
            <th>Dataset</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody id='tableBody'></tbody>
      </table>          
    </div>
  </div>
  <div class="wrap" id="topography-wrap" title="Topography-Wrap">
    <div class="top-right-buttons">
      <button type="button" class="close close-button" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    </div>
    <div class="content">

    </div>
  </div>
  <div id="information-div">
    <div id="information-div-contents">
      <p>This website provides InSAR displacement time-series produced by the University of Miami Geodesy Laboratory,   which is supported by NASA and the NSF. To identify data sets from published papers please search for the author's names.<p>

        <p>This website was created by  University of Miami. Computer Science students Alfredo Terrero and Zishi Wu. It started as a class project of CSC 431, taught by  Chris Mader and Julio Perez of the University of Miami’s Center for Computational Sciences (CCS). The data processing is conducted using the University of Miami’s High Performance Computing systems
        </p>        
        @if (Auth::guest())
          <p>
            To identify data sets from published papers please search for the author's names. To access data sets which are not yet finalized, please login here:
          </p>
          <div id="login-logout-button">
            <button class="btn btn-primary-outline">Login</button>
          </div>          
        @endif
        <img src="img/nasa.png" alt="nasa_logo" height="100px" width="auto">
        <img src="img/nsf1.gif" alt="nsf_logo" height="100px" width="auto" class="logo2">
        <div id="information-div-buttom-buttons">
          <div id="close-information-button">       
            <button class="btn btn-primary-outline">Done</button>
          </div>          
        </div>
      </div>
    </div>
    <?php
    echo "
    <script type=\"text/javascript\">
      var fileName = \"$fileName\";
    </script>
    ";
    ?>
    <script type="text/javascript" src="js/ColorScale.js"></script>
    <script type="text/javascript" src="js/AreaMarkerLayer.js"></script>
    <script type="text/javascript" src="js/AreaAttributesController.js"></script>
    <script type="text/javascript" src="js/mainPage.js"></script>
    <script type="text/javascript" src="js/mainMap.js"></script>
    <script type="text/javascript" src="js/SquareSelector.js"></script>
    <script type="text/javascript" src="js/LineSelector.js"></script>
    <script type="text/javascript" src="js/GoogleElevationChunkedQuerier.js"></script>
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBm77jFIq1iM3mpL5CgB1uvW6jGcefbIYs"
    async defer></script>
  </body>
  </html>
