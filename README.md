# Live Visualizer

Live Visualizer is a program that allows DJs to have appealing visuals running in the background which are in sync with the music. It is available for Windows and Mac OS and can be downloaded from the Releases tab in Github (not available yet).

## Download

Download the latest version of Live Visualizer for Windows and Mac OS from the Releases tab in Github (not available yet).

## Usage

### Opening a Visualizer
To open a Visualizer, follow theses steps:

1. Download a Live Visualizer Animation (.lva file).
2. Download it's corresponding Live Visualizer Configuration (.lvc file).
3. Double-click the .lvc file to open the Visualizer

### Creating a Live Visualizer Config (.lvc) File
To create a Live Visualizer Config (.lvc) file, follow these steps:

1. Open a text editor of your choice.
2. Create a new file and save it with the `.lvc` file extension.
3. Format the file in JSON or JSON with comments.
4. Define the `visualizer_path` field as it is required and must be specified in the file. It should point to the .lva file that contains the animation for the visualizer.
5. Define the properties for the visualizer in the file. Each property is an object with a field `value` for its value.

Here is an example `.lvc` file:

```jsonc
{
    // Path to the .lva file
    "visualizer_path": "path/to/my_visualizer.lva",

    // Properties for the visualizer (optional)
    "properties": {
        "background_color": {
            "value": "#000000"
        },
        "foreground_color": {
            "value": "#ffffff"
        },
        "font_size": {
            "value": 14
        },
    },

    // Images used by the visualizer (optional)
    "images": [
        "image1.png",
        "image2.jpg"
    ],

    // Enable dev tools (optional)
    "dev": true
}
```
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
window.visualizerPropertyListener(properties => {
  // do something with the properties
})
```

Each property is represented by an object, and the value for that property is stored in the `value` field of the object. For example, to access the value of the `color` property, you would use `properties.color.value`.

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

## Credits
### Code Contributions
We would like to give credit to the following third-party library:
- [WPE-Audio-Simulator](https://github.com/ClassicOldSong/WPE-Audio-Simulator) by ClassicOldSong - Provided the code for the audio fft data, which was adapted and modified for use in this project under the terms of the MIT License.

## License
Live Visualizer is licensed under the MIT License. See LICENSE for more information.
