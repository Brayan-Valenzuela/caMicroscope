let PDR = OpenSeadragon.pixelDensityRatio;
const IDB_URL = "indexeddb://";
var csvContent;

// INITIALIZE DB
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
// id(autoinc), name, location(name+id), classes
var request, db;

// tensorflowjs creates its own IndexedDB on saving a model.
(async function(callback) {
    const model = tf.sequential();
  await model.save('indexeddb://dummy');
  await tf.io.removeModel('indexeddb://dummy');
  console.log('DB initialised');
  callback();
})(dbInit)

// Opening the db created by tensorflowjs
function dbInit() {
  request = window.indexedDB.open("tensorflowjs", 1);

  request.onupgradeneeded = function (e) {
    console.log('nasty!');
  }
  request.onerror = function (e){
    console.log("ERROR", e);
  }
  request.onsuccess = function(e) {
    db = request.result;
    // console.log(db.objectStoreNames);
    console.log('tfjs db opened and ready');
  }
}


let $CAMIC = null;
const $UI = {};
const $D = {
  pages: {
    home: '',
    table: ''
  },
  params: null
};
// const objAreaMin = 400;
// const objAreaMax = 4500;
// const lineWidth = 2;
// const timeOutMs = 10;


function initialize() {
      var checkPackageIsReady = setInterval(function () {
        if(IsPackageLoading) {
          clearInterval(checkPackageIsReady);
            initUIcomponents();
            initCore();
        }
      }, 100);
}

async function initUIcomponents() {
  /* create UI components */

  // Create uploadModal for model uploads.
  $UI.uploadModal = new ModalBox({
    id:'upload_panel',
    hasHeader:true,
    headerText:'Upload Model',
    hasFooter:false,
    provideContent: true,
    content: `
      <form action="#">
        <label align="left"> Name:  </label> <input name="name" id="name" type="text" required /> <br> <hr>
        <div> Enter the classes model classifies into separated by comma. </div>
        <label align="left"> Classes: </label> <input name="classes" id="classes" type="text" required /> <br><hr>
        <label align="left"> Input image size: </label> <input name="image_size" id="image_size" type="number" required /> <br>
        <input type="radio" id="gray" name="channels" value=1 checked>
        <label for="gray">Gray</label>
        <input type="radio" id="rgb" name="channels" value=3>
        <label for="rgb">RGB</label> <br>
        <label for="magnification">Magnification:</label><hr>
        <select id="magnification">
          <option value=20>20x</option>
          <option value=40>40x</option>
        </select>
        <label class="switch"><input type="checkbox" id="togBtn"><div class="slider"></div></label> <br> <br>
        <div class="checkfalse"><div>Select model.json first followed by the weight binaries.</div> <br> 
        <input name="filesupload" id="modelupload" type="file" required/>
        <input name="filesupload" id="weightsupload" type="file" multiple="" required/> <br> <br> </div>
        <div class="checktrue" > URL to the ModelAndWeightsConfig JSON describing the model. <br> <br> 
        <label align-"left"> Enter the URL: </label> <input type="url" name="url" id="url" required> <br><br></div>
        <button id="submit">Upload</button> <span id="status"></span>
      </form>  
    `
  });

  // Create infoModal to show information about models uploaded.
  $UI.infoModal = new ModalBox({
    id: "model_info",
    hasHeader: true,
    headerText: "Available Models",
    hasFooter: false,
    provideContent: true,
    content: `
      <table id='mtable'>
        <thead>
          <tr>
            <th>Name</th>
            <th>Classes</th>
            <th>Input Size</th>
            <th>Size (MB)</th>
            <th>Date Saved</th>
          </tr>
          <tbody id="mdata">
          </tbody>
        </thead>
      </table>
    `
  });

  // Create infoModal to show information about models uploaded.
  $UI.helpModal = new ModalBox({
    id: "help",
    hasHeader: true,
    headerText: "Help",
    hasFooter: false
  });

  // create the message queue
  $UI.message = new MessageQueue();
  let dropDownList = [];
  Object.keys(await tf.io.listModels()).forEach(function (element) {
    let dict = {};    
    let value = element.split("/").pop();
    console.log(value)
    console.log(value.slice(0, 3))
    if (value.slice(0, 4) == 'pred') {
      let title = element.split("/").pop().split("_")[1].slice(0, -3);
      dict.icon = "flip_to_back";
      dict.title = title;
      dict.value = value;
      dict.checked = false;
      dropDownList.push(dict);
    }
  });
  console.log(dropDownList)

  // create toolbar
  $UI.toolbar = new CaToolbar({
    id: 'ca_tools',
    zIndex: 601,
    hasMainTools: false,
    subTools: [
      {
        icon: 'aspect_ratio',
        type: 'check',
        value: 'rect',
        title: 'Predict',
        callback: drawRectangle
      },{
        icon: 'keyboard_arrow_down',
        type: 'dropdown',
        value: 'rect',
        dropdownList: dropDownList,
        title: 'Select Model',
        callback: setValue
      },{
        icon: 'insert_photo',
        type: 'btn',
        value: 'viewer',
        title: 'Viewer',
        callback: function () {
          if (window.location.search.length > 0) {
            window.location.href = '../viewer/viewer.html' + window.location.search;
          } else {
            window.location.href = '../viewer/viewer.html';
          }
        }
      },{
        icon: 'add',
        type: 'btn',
        value: 'Upload model',
        title: 'Add model',
        callback: uploadModel
      },{
        icon: 'info',
        type: 'btn',
        value: 'Model info',
        title: 'Model info',
        callback: showInfo
      },{
        icon: 'help',
        type: 'btn',
        value: 'Help',
        title: 'Help',
        callback: openHelp
      },{
        icon: 'bug_report',
        title: 'Bug Report',
        value: 'bugs',
        type: 'btn',
        callback: () => {
          window.open('https://goo.gl/forms/mgyhx4ADH0UuEQJ53', '_blank').focus()
        }
      }
    ]
  });
}

// setting core functionality
function initCore() {
  // start initial
  const opt = {
    hasZoomControl: true,
    hasDrawLayer: true,
    hasLayerManager: true,
    hasScalebar: true,
    hasMeasurementTool: true
  };

  // set states if exist
  if ($D.params.states) {
    opt.states = $D.params.states;
  }

  try {
    let slideQuery = {}
    slideQuery.id = $D.params.slideId;
    slideQuery.name = $D.params.slide;
    slideQuery.location = $D.params.location;
    $CAMIC = new CaMic("main_viewer", slideQuery, opt);
  } catch (error) {
    Loading.close();
    $UI.message.addError('Core Initialization Failed');
    console.error(error);
    return;
  }

  $CAMIC.loadImg(function (e) {
    // image loaded
    if (e.hasError) {
      $UI.message.addError(e.message)
    }else{
      $D.params.data = e;
    }
  });

  $CAMIC.viewer.addOnceHandler('open', function (e) {
    const viewer =  $CAMIC.viewer;
    // add stop draw function
    viewer.canvasDrawInstance.addHandler('stop-drawing', camicStopDraw);

    // UI to select the part of image
    $UI.modelPanel = new ModelPanel(viewer);

    // Model is selected and run right after you choose it from the select.
    // $UI.modelPanel.__modelselector.addEventListener('change', function(e) {
    //   console.log($UI.modelPanel.__modelselector.value);
    //   runPredict($UI.modelPanel.__modelselector.value);
    // }.bind($UI.modelPanel));

    $UI.modelPanel.__btn_save.addEventListener('click', function(e) {
      let fname = $D.params.slideId + '_roi.png';

      download($UI.modelPanel.__fullsrc,fname);
    }.bind($UI.modelPanel));

    // TO-DO -Save class probabilities
    $UI.modelPanel.__btn_savecsv.addEventListener('click', function(e) {
      let fname = $D.params.slideId + '_roi.csv';
      downloadCSV(fname);
    }.bind($UI.modelPanel));
  });
  
}

function setValue(args) {
  console.log(args)
  $UI.args = args;
}

/**
 * Toolbar button callback
 * @param e
 */
function drawRectangle(e) {

  let canvas = $CAMIC.viewer.drawer.canvas; //Original Canvas
  canvas.style.cursor = e.checked ? 'crosshair' : 'default';

  const canvasDraw = $CAMIC.viewer.canvasDrawInstance;
  let args = $UI.args;
  canvasDraw.drawMode = 'stepSquare';
  // Save size in an arg list
  console.log(args)
  if (args) canvasDraw.size = args.status.split('_')[1].split('-')[0];
  else canvasDraw.size = 1;
  console.log(canvasDraw.size)
  canvasDraw.style.color = '#FFFF00';
  canvasDraw.style.isFill = false;

  if (e.checked) {
    canvasDraw.drawOn();
  } else {
    canvasDraw.drawOff();
  }
}

/**
 * This is basically onmouseup after drawing rectangle.
 * @param e
 */
function camicStopDraw(e) {

  const viewer = $CAMIC.viewer;
  const canvasDraw = viewer.canvasDrawInstance;

  let imgColl = canvasDraw.getImageFeatureCollection();
  if (imgColl.features.length > 0) {

    // Check size first
    let box = checkSize(imgColl, viewer.imagingHelper);

    if (Object.keys(box).length === 0 && box.constructor === Object) {
      console.error('SOMETHING WICKED THIS WAY COMES.');
    } else { 
      let args = $UI.args;
      if (args) {
        runPredict(args.status);
      }
      $UI.modelPanel.setPosition(box.rect.x,box.rect.y,box.rect.width,box.rect.height);
      $UI.modelPanel.open(args);

      canvasDraw.clear();
      csvContent = "";
    }

  } else {
    console.error('Could not get feature collection.')
  }

}

function checkSize(imgColl, imagingHelper) {

  // 5x2 array
  let bound = imgColl.features[0].bound;
// slide images svsslide images svs
  // get position on viewer

  const top_left = imgColl.features[0].bound[0];
  const bottom_right = imgColl.features[0].bound[2];
  const min = imagingHelper._viewer.viewport.imageToViewportCoordinates(top_left[0],top_left[1]);
  const max = imagingHelper._viewer.viewport.imageToViewportCoordinates(bottom_right[0],bottom_right[1]);
  const rect = new OpenSeadragon.Rect(min.x,min.y,max.x-min.x,max.y-min.y);
  const self = $UI.modelPanel;
  
  self.__top_left = top_left;
  self.__spImgX = top_left[0];
  self.__spImgY = top_left[1];
  self.__spImgWidth = bottom_right[0]-top_left[0];
  self.__spImgHeight = bottom_right[1]-top_left[1];
  // console.log('iX: '+self.__spImgX);
  // console.log('iY: '+self.__spImgY);
  // console.log('iW: '+self.__spImgWidth);
  // console.log('iH: '+self.__spImgHeight);
  
  // console.log(top_left);
  // console.log(bottom_right);
  // console.log(imagingHelper._viewer.viewport.viewportToImageCoordinates(0,0));

  // Convert to screen coordinates
  let foo = convertCoordinates(imagingHelper, bound);

  //retina screen
  let newArray = foo.map(function (a) {
    let x = a.slice();
    x[0] *= PDR;
    x[1] *= PDR;
    return x;
  });
  // console.log('bounds', newArray);

  const xCoord = Math.round(newArray[0][0]);
  const yCoord = Math.round(newArray[0][1]);
  let width = Math.round(newArray[2][0] - xCoord);
  let height = Math.round(newArray[2][1] - yCoord);

  self.__x = xCoord;
  self.__y = yCoord;
  self.__width = xCoord;
  self.__height = yCoord;

  // check that image size is ok
  if (width * height > 8000000) {
    alert("Selected ROI too large, current version is limited to 4 megapixels");
    // Clear the rectangle  canvas-draw-overlay.clear()
    $CAMIC.viewer.canvasDrawInstance.clear();
    return {}; //throw('image too large')
  } else {
    return {rect:rect,'xCoord': xCoord, 'yCoord': yCoord, 'width': width, 'height': height};
  }
}

/**
 * Run model
 * @param key
 */
function runPredict(key) {

  // But first, some setup...
  const self = $UI.modelPanel;
  let X = self.__spImgX,
      Y = self.__spImgY,
      totalSize = self.__spImgWidth,
      step = parseInt(key.split('_')[1].split('-')[0]);


  const prefix_url = ImgloaderMode == 'iip'?`../../img/IIP/raw/?IIIF=${$D.params.data.location}`:$CAMIC.slideId;
  self.showProgress("Predicting...");

  let fullResCvs = self.__fullsrc;

  var imgData = fullResCvs.getContext('2d').getImageData(0,0,fullResCvs.width,fullResCvs.height);

  // Starting the transaction and opening the model store
  let tx = db.transaction("models_store", "readonly");
  let store = tx.objectStore("models_store");
  store.get(key).onsuccess = async function (e) {
    // Keras sorts the labels by alphabetical order.
    let classes = e.target.result.classes.sort();

    let input_shape = e.target.result.input_shape
    // let input_channels = parseInt(input_shape[3]);
    let input_channels = 3;
    let image_size = input_shape[1];

    model = await tf.loadLayersModel(IDB_URL + key);
    self.showProgress("Model loaded...");

    // Warmup the model before using real data.
    const warmupResult = model.predict(tf.zeros([1, image_size, image_size, input_channels]));
    warmupResult.dataSync();
    warmupResult.dispose();
    console.log("Model ready");

    let temp = document.querySelector('#dummy');
    temp.height = step;
    temp.width = step;

    function addImageProcess(src){
      console.log('in load')
      return new Promise((resolve, reject) => {
        let img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })
    }

    let results = {};
    classes.forEach((e) => {
      results[e] = 0;
    });
    // let coors = [];
    var dy = 0;
    for (let y = Y, dy = 0; y < (Y + totalSize); y+=(step)) {
      let dx = 0
      for (let x = X; x < (X + totalSize); x+=(step)) {
        // coors.push([x, y, dx, dy]);

        step=48
        let src = prefix_url+'\/'+x+','+y+','+step+','+step+'\/'+step+',/0/default.jpg';
        // let img_l = new Image();
        // img_l.src = src;
        console.log('before load');
        let l_img = await addImageProcess(src);
        console.log('after load');
        fullResCvs.height = l_img.height;
        fullResCvs.width = l_img.width;
        fullResCvs.getContext('2d').drawImage(l_img, 0, 0);

        // dummy.getContext('2d').drawImage(img, dx, dy);
        let imgData = fullResCvs.getContext('2d').getImageData(0,0,fullResCvs.width,fullResCvs.height);

        const img = tf.browser.fromPixels(imgData).toFloat();
        let img2;
        if (input_channels == 1) {
          img2 = tf.image.resizeBilinear(img, [image_size, image_size]).mean(2);
        } else {
          img2 = tf.image.resizeBilinear(img, [image_size, image_size]);
        }
        let offset = tf.scalar(127.5);
        let normalized = img2.sub(offset).div(offset);
        let batched = normalized.reshape([1, image_size, image_size, input_channels]);
        let values = await model.predict(batched).data();
        // Retrieving the top class
        const predictions = await getTopKClasses(values, classes, 1); 
        self.hideProgress();
        console.log(predictions[0].className + " - " + predictions[0].probability);
        predictions.forEach((e) => {
          results[e.className] = results[e.className] + e.probability;
        });
        // results.push(predictions);


        dx += step;
      }
      dy += step;
    }

    let n = totalSize/step;

    // mean value
    Object.keys(results).forEach((e)=>{
      results[e] /= (n**2)
    });

    i_max = Object.keys(results).reduce((a, b) => results[a] > results[b] ? a : b);
    self.showResults('' + i_max + '-' + results[i_max])

  };
}

/**
 * Computes the probabilities of the topK classes given logits by computing
 * softmax to get probabilities and then sorting the probabilities.
 * @param logits Tensor representing the logits from MobileNet.
 * @param topK The number of top predictions to show.
 */
function getTopKClasses(values, classes, topK) {
  // const values = await logits.data();
  // console.log(values);

  const indexOfMaxValue = values.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);

  const topClassesAndProbs = [];

  topClassesAndProbs.push({
      className: classes[indexOfMaxValue],
      probability: values[indexOfMaxValue]
  })

  csvContent = "data:text/csv;charset=utf-8,"

  try {
    for (let i = 0; i < classes.length; i++) {
      csvContent += classes[i] + "," + values[i] + "\r\n"
    }
  } catch { console.log("Unequal dimensions of output layer and class input."); }

  return topClassesAndProbs;
}

// TO-DO: Allow uploading and using tensorflow graph models
function uploadModel() {

  var _name = document.querySelector('#name'),
      _classes = document.querySelector('#classes'),
      mag = document.querySelector('#magnification'),
      _image_size = document.querySelector("#image_size"),
      topology = document.querySelector('#modelupload'),
      weights = document.querySelector('#weightsupload'),
      status = document.querySelector('#status'),
      toggle = document.querySelector('#togBtn'),
      url = document.querySelector("#url"),
      submit = document.querySelector("#submit");

  // Reset previous input
  _name.value = _classes.value = topology.value = weights.value = status.innerHTML = _image_size.value = url.value = '';

  $UI.uploadModal.open();

  toggle.addEventListener('change', function (e) {
    if (this.checked) {
      document.querySelector(".checktrue").style.display = "block";
      document.querySelector(".checkfalse").style.display = "none";
    } else {
      document.querySelector(".checktrue").style.display = "none";
      document.querySelector(".checkfalse").style.display = "block";
    }

  });


  submit.addEventListener('click', async function (e) {
    e.preventDefault();
    
    if ( _name.value && _classes.value && _image_size.value && 
      ((!toggle.checked && topology.files[0].name.split('.').pop() == 'json') || (toggle.checked && url))) {

      status.innerHTML = "Uploading";
      status.classList.remove('error');
      status.classList.add('blink');

      let _channels = parseInt(document.querySelector('input[name="channels"]:checked').value);
      // Adding some extra digits in the end to maintain uniqueness
      let name = 'pred_'  + _image_size.value.toString() + '-' + mag.value.toString() + '_' + _name.value + (new Date().getTime().toString()).slice(-4, -1);
      // Create an array from comma separated values of classes
      let classes = _classes.value.split(/\s*,\s*/);

      if (toggle.checked) { var modelInput = url.value; }
      else { var modelInput = tf.io.browserFiles([topology.files[0], ...weights.files]) }
      
      try {

        // This also ensures that valid model is uploaded.
        const model = await tf.loadLayersModel(modelInput);
        await model.save(IDB_URL + name);

        // Update the model store db entry to have the classes array
        tx = db.transaction("models_store", "readwrite");
        store = tx.objectStore("models_store");

        store.get(name).onsuccess = function (e) {
          let data = e.target.result;
          data['classes'] = classes;
          data['input_shape'] = [1, parseInt(_image_size.value), parseInt(_image_size.value), parseInt(_channels)]

          let req = store.put(data);
          req.onsuccess = function (e) {
            console.log("SUCCESS, ID:", e.target.result);
            status.innerHTML = "Done!";
            status.classList.remove('blink');
          }
          req.onerror = function (e) {
            status.innerHTML = "Some error this way!";
            console.log(e);
            status.classList.remove('blink');
          }
        }
        
      } catch (e) {
        status.classList.add('error');
        status.classList.remove('blink');
        if (toggle.checked) status.innerHTML = "Please enter a valid URL."
        else status.innerHTML = "Please enter a valid model. Input model.json in first input and all weight binaries in second one without renaming.";
        console.error(e);
      } 

    } else {
      status.innerHTML = "Please fill out all the fields with valid values."
      status.classList.add('error');
      console.error(e);
    }
    
  });  
}

// Shows the uploaded models' details
async function showInfo() {
  
  var data = await tf.io.listModels(),
      table = document.querySelector('#mdata'),
      tx = db.transaction("models_store", "readonly"),
      store = tx.objectStore("models_store");

  empty(table);
  // Update table data
  (function (callback) {
    for (let key in data) {
      let name = key.split("/").pop(),
          date = data[key].dateSaved.toString().slice(0,15),
          size = (data[key].modelTopologyBytes + data[key].weightDataBytes + data[key].weightSpecsBytes) / (1024*1024),
          row = table.insertRow(),
          classes, input_shape, td;

      console.log(name.slice(0, 4));
      if (name.slice(0, 4) == "pred") {
        store.get(name).onsuccess = function (e) {
          classes = (e.target.result.classes.join(', '));
          input_shape = e.target.result.input_shape.slice(1, 3).join("x");
          td = row.insertCell();
          td.innerHTML = name.slice(5, -3);
          td = row.insertCell();
          td.innerHTML = classes;
          td = row.insertCell();
          td.innerHTML = input_shape;
          td = row.insertCell();
          td.innerHTML = +size.toFixed(2);
          td = row.insertCell();
          td.innerHTML = date;
        }
      }
    }
    callback;
  })($UI.infoModal.open())


}

function openHelp() {
  let self = $UI.helpModal
  self.body.innerHTML = `
    <em>Features</em> <br>
    This part of caMicroscope allows to predict using a trained model on a selected patch. Some of the sample 
    models are hosted <a target="_blank" href="https://github.com/Insiyaa/caMicroscope-tfjs-models">here</a>. <br>
    <i class="material-icons">aspect_ratio</i>: On activation, this button enables drawing on the viewer. After the image is loaded for further processing, a UI will
    appear for model selection. The Whole-slide images are high resolution images containing the entire sampled tissue so make sure 
    you zoom in and then select a patch. Selecting a large region while being totally zoomed out may slow down the further processing
    due to fairly large image size. <br>
    <i class="material-icons">insert_photo</i>: This will redirect back to main Viewer. <br>
    <i class="material-icons">add</i>: This will open a dialogue box to upload the model. Make sure to fill in all the fields. The image size field expects a
    single integer. <br>
    <i class="material-icons">info</i>: This will display the details of previously uploaded models. <br>
    <i class="material-icons">bug_report</i>: Bug report.
  `
  $UI.helpModal.open()
}

/**
 * Convert a dataURI to a Blob
 *
 * @param dataURI
 * @returns {Blob}
 */
function dataURItoBlob(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  let byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
  else
    byteString = unescape(dataURI.split(',')[1]);

  // separate out the mime component
  let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  let ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], {type: mimeString});
}

/**
 * Convert image coordinates
 */
function convertCoordinates(imagingHelper, bound) {

  let newArray = bound.map(function (arr) {
    return arr.slice(); // copy
  });

  // 'image coordinate' to 'screen coordinate'
  for (let i = 0; i < newArray.length; i++) {
    let boundElement = newArray[i];
    for (let j = 0; j < boundElement.length; j++) {
      newArray[i][j] = j === 0 ? imagingHelper.dataToPhysicalX(boundElement[j])
        : imagingHelper.dataToPhysicalY(boundElement[j]);
    }
  }

  return newArray;

}

// Save the canvas to filename.  Uses local save dialog.
function download(canvas, filename) {

  /// create an "off-screen" anchor tag
  var lnk = document.createElement('a'),
      e;

  /// the key here is to set the download attribute of the a tag
  lnk.download = filename;

  /// convert canvas content to data-uri for link. When download
  /// attribute is set the content pointed to by link will be
  /// pushed as "download" in HTML5 capable browsers
  lnk.href = canvas.toDataURL();

  /// create a "fake" click-event to trigger the download
  if (document.createEvent) {

      e = document.createEvent("MouseEvents");
      e.initMouseEvent("click", true, true, window,
                       0, 0, 0, 0, 0, false, false, false,
                       false, 0, null);

      lnk.dispatchEvent(e);

  } else if (lnk.fireEvent) {

      lnk.fireEvent("onclick");
  }
}

// Build a csv of the polygons and associated metadata
// function buildAndDownloadCSV(contours,fname) {
//   let data = '';
//   let tmp = new cv.Mat();
//   const self = $UI.modelPanel;
//   const nl = '\n';
//   const vpx = self.__top_left[0];
//   const vpy = self.__top_left[1];
//   const spx = self.__x;
//   const spy = self.__y;

//   console.log('In Download and Save CSV');
//   data += 'AreaInPixels,PereimeterInPixels,Polygon\n';

//   for (let i = 1; i < contours.size(); ++i) {
//     let cnt = contours.get(i);
//     // console.log(contours[i]);
//     let area = cv.contourArea(cnt,false);
//     let perimeter = cv.arcLength(cnt,true);
//     if(area < self.__maxarea.value && area > self.__minarea.value) {
//       data += area + ',' + perimeter + ',[';
//       cv.approxPolyDP(cnt, tmp, 1, true);
//       let carray = tmp.data32S;
//       let asize = tmp.data32S.length;
//       for(j = 0;j < asize-1;j+=2) {
//         let imgX = carray[j]+vpx+spx;
//         let imgY = carray[j+1]+vpy+spy;
//         if(j<(asize-2)) {
//           data += imgX + ':' + imgY + ':';
//         } else {
//           data += imgX + ':' + imgY + ']';
//         }
//       }
//       data += nl;
//     }
//   }
//   downloadCSV(data, fname);
// }

// Save the polygons to csv with filename.  Uses local save dialog.
function downloadCSV(filename) {
  const self = $UI.modelPanel;
  if (csvContent) {
    filename = filename || 'export.csv';
    let data = encodeURI(csvContent);

    link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();
  } else {
    self.showResults("Pleae select a model first");
  }
}
