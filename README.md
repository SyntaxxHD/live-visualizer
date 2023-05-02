# Live Visualizer

Live Visualizer is a program that allows DJs to have appealing visuals running in the background which are in sync with the music. It is available for Windows and Mac OS and can be downloaded from the Releases tab in Github (not available yet).

## ToDo

- [x] Config file save cooldown
- [x] Live change of properties in spectrum
- [x] File change detection
- [x] Settings dialog
- [x] Audio source selection
- [ ] Automatic updates
- [ ] Dark mode support
- [x] Visualizer title in UI
- [x] Shorter text boxes

## Download

Download the latest version of Live Visualizer for Windows and Mac OS from the Releases tab in Github (not available yet).

## Usage

### Opening a Visualizer

To open a Visualizer, follow theses steps:

1. Download a Live Visualizer Animation (.lva file).
2. Download it's corresponding Live Visualizer Configuration (.lvc file).
3. Double-click the .lvc file to open the Visualizer

### User Interface (UI) Guide

#### Editing Visualizer Configuration

To edit a Visualizer configuration, first open the Live Visualizer App. You can then either drag and drop the desired file into the UI or select it from the menu. Modify the values using the provided form elements, and the configuration will save automatically.

#### Changing Audio Input Source

To change the audio input source, open the settings and choose the desired source from the dropdown menu. Note that Desktop Audio is not available on Mac OS X.


### Creating a Live Visualizer Config (.lvc) File

To create a Live Visualizer Config (.lvc) file, follow these steps:

1. Open a text editor of your choice.
2. Create a new file and save it with the `.lvc` file extension.
3. Format the file in JSON or JSON with comments.
4. Define the `visualizer_path` field as it is required and must be specified in the file. It should point to the .lva file that contains the animation for the visualizer.
5. Define the properties for the visualizer in the file. Read the next section to unterstand them better.

Here is an example `.lvc` file:

```jsonc
{
  // Path to the .lva file
  "visualizer_path": "path/to/my_visualizer.lva",

  // Title for the visualizer (mandatory but only relevant for the UI)
  "title": "Awesome visualizer",

  // Properties for the visualizer (optional)
  "properties": {
    // (Next section)
  },

  // Images used by the visualizer (optional)
  "images": ["image1.png", "image2.jpg"],

  // Enable dev tools (optional)
  "dev": true
}
```

#### Property Types

The following property types are supported:

1. **Color**: Represents a color value. It displays a color picker in the UI to set the value.

```jsonc
"color_property": {
  "label": "Background Color", // The label for the property
  "type": "color", // The type of the property
  "value": "#6b6b6b" // The value of the property (Possible types are hex, rgb() and hsl()).
}
```

2. **Slider**: Represents a numeric value with a defined range. It displays a slider in the UI to set the value.

```jsonc
"slider_property": {
  "min": 1, // The minimum value for the slider
  "max": 10, // The maximum value for the slider
  "step": 1, // The step value for the slider
  "label": "Slider", // The label for the property
  "type": "slider", // The type of the property
  "value": 3 // The value of the property
}
```

3. **Checkbox**: Represents a boolean value (true or false). It displays a checkbox in the UI to set the value.

```jsonc
"checkbox_property": {
  "label": "Checkbox", // The label for the property
  "type": "checkbox", // The type of the property
  "value": true // The value of the property
}
```

4. **Select**: Represents a value from a set of predefined options. It displays a dropdown list in the UI to set the value.

```jsonc
"dropdown_property": {
  "options": [
    {"label": "32", "value": 32},
    {"label": "64", "value": 64},
    {"label": "128", "value": 128},
    // ...
  ],
  "label": "Dropdown",
  "type": "select",
  "value": 128
}
```

5. **Category**: Represents a group of related properties. It displays a collapsible section in the UI containing the nested properties.

```jsonc
"category_property": {
  "properties": {
    "nested_property_1": {
      "min": 1,
      "max": 100,
      "step": 1,
      "label": "Nested Property 1",
      "type": "slider",
      "value": 10
    },
    "nested_property_2": {
      "label": "Nested Property 2",
      "type": "checkbox",
      "value": true
    }
  },
  "label": "Category",
  "type": "category",
  "value": false // The value determines if the category is expanded (true) or collapsed (false) by default
}
```

6. **File**: Represents a file input. It displays a file picker in the UI to set the value.

```jsonc
"file_property": {
  "label": "Background Image", // The label for the property
  "type": "file", // The type of the property
  "value": "", // The value of the property (empty string means no file is selected)
  "fileType": "image" // The type of the file (available file types are "image" and "video")
}
```

7. **Text**: Represents a text input. It displays a text input field in the UI to set the value.

```jsonc
"text_property": {
  "label": "Splash Text", // The label for the property
  "type": "text", // The type of the property
  "value": "Hello World" // The value of the property
}
```
#### Usage of properties
To use these property types, simply add them to the JSON configuration file for your project. The UI will automatically generate the corresponding input elements based on the properties you define.

For example, to add a color picker for background color, a slider for bloom intensity, and a checkbox for random color, your JSON configuration file would look like this:

```jsonc
"properties": {
  "background_color": {
    "label": "Background Color",
    "type": "color",
    "value": "#6b6b6b"
  },
  "sound_sensitivity": {
    "min": 0,
    "max": 10,
    "step": 0.01,
    "label": "Sound Sensitivity",
    "type": "slider",
    "value": 5
  },
  "colorful": {
    "label": "Random Color",
    "type": "checkbox",
    "value": true
  },
  // ... other properties
}
```

The UI will then display a color picker, a slider, and a checkbox with the respective labels and default values. Users can interact with these input elements to adjust the properties of your project as needed.

### Creating a Live Visualizer Animation (.lva) File
To create a Live Visualizer Animation (.lva) file, follow these steps:

1. Create a new folder.
2. Add a `visualizer.html` file to the folder. This file contains the visualizer's HTML code (Only what's inside the `body` tag).
3. Optionally, add a `visualizer.css` file to the folder. This file contains the visualizer's CSS code.
4. Optionally, add a `visualizer.js` file to the folder. This file contains the visualizer's JavaScript code.
5. Add any images used by the visualizer to an `images` folder inside the folder.
6. Zip the folder and change the extension to `.lva`.

Make shure that you add all image filenames to the `images` field of your Live Visualizer Configuration.
If you want to use the Dev Tools you can enable them by setting the `dev`field to `true`.

### Using Audio Data
To use audio data in your Visualizer, you need to register the following function to get FFT (Fast Fourier Transform) events:

```javascript
window.registerFFTDataListener(audioArray => {
  // do something with the audioArray
})
```

The `audioArray` parameter contains the actual audio data. This array has a fixed length of 128.

Array elements 0 until 63 contain volume levels for the left channel. Array elements 64 until 127 contain the volume levels for the right channel.

The lower array elements for each channel represent bass frequencies, so at array index 0, you will find the lowest bass sounds for the left channel and at array element 64, you will find the bass sounds for the right audio channel. The higher up you go in the array, the higher the audio frequencies will get, so array indices closest to 64 will contain treble audio volume levels for the left channel and array indices closest to array index 127 will contain the treble audio volume levels for the right channel.

Each array will generally contain a floating point value from 0.00 to 1.00. 0.00 means that the specific frequency is currently not playing any sound and 1.00 means that the frequency is playing at its maximum volume.

### Importing/Using Properties

You can use the following function to listen for changes in the visualizer properties:

```javascript
window.visualizerPropertyListener((properties) => {
  if (properties.color) background.style.color = properties.color
});
```

Each property is represented by an object, and the value for that property is stored in the key of the object. For example, to access the value of the `color` property, you would use `properties.color`.

### Importing custom files
As already mentioned above, you can import custom files by putting them in their respective folder (currently only images) and registering them in the images field in your Live Visualizer Config. To actually use the file, you can use the following function:

```javascript
image.src = window.getGlobalFile('filename.png');
```
This will return a base64 encoded string of the file (including it's headers).

### Converting a color string to RGB
The `window.convertToRGB(color)` function is a utility function designed to convert various color representations into an RGB object. This function can accept a color represented in one of the following formats:

1. Hexadecimal color code (e.g., `#FF5733`)
2. RGB color function (e.g., `rgb(255, 87, 51)`)
3. HSL color function (e.g., `hsl(12, 100%, 60%)`)

The function returns an object containing the red (r), green (g), and blue (b) values of the input color. The RGB values are integers ranging from 0 to 255. This function allows you to easily convert a color representation from one format to another or perform color manipulations using the RGB values.

Here's an example of how you can use the function:

```javascript
const color = '#ff0000'; // Hexadecimal color value for red
const rgb = window.convertToRGB(color);

console.log(rgb.r); // Outputs 255
console.log(rgb.g); // Outputs 0
console.log(rgb.b); // Outputs 0
```

## Prerequisites for Developers

1. Clone the repository with

```bash
git clone https://github.com/SyntaxxHD/live-visualizer.git
```

2. Install node version 18.15.0 or higher from https://nodejs.org/en/download
3. Run the following command to install dependencies:

```bash
npm install
```

4. Run a visualizer with the path to the config with

```bash
electron . path/to/config.lvc
```

or run the UI with

```bash
npm start
```

## Credits

### Code Contributions

We would like to give credit to the following third-party library:

- [WPE-Audio-Simulator](https://github.com/ClassicOldSong/WPE-Audio-Simulator) by ClassicOldSong - Provided the code for the audio fft data, which was adapted and modified for use in this project under the terms of the MIT License.

## License

Live Visualizer is licensed under the MIT License. See LICENSE for more information.
