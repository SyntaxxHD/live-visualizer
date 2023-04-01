window.wallpaperPropertyListener = {
    applyUserProperties: (properties) => {
        /*************/
        //Bar settings
        /*************/
        if (properties.barWidth) {
            settings.bars.width = properties.barWidth.value;
            updateBars();
        }
        if (properties.barPadding) {
            settings.bars.padding = properties.barPadding.value;
            updateBars();
        }
        if (properties.barCustomColour) {
            settings.bars.custom = properties.barCustomColour.value
        }
        if (properties.barColour) {
            if (!settings.bars.custom) {
                settings.bars.colour = properties.barColour.value;
                if (getBrightness(settings.bars.colour) > 240) {
                    defaultSrc = "BlackLogo.png"
                } else {
                    defaultSrc = "Logo.png"
                }
                if (!settings.logo.custom) {
                    loadImage(logo, defaultSrc)
                }
            }
        }
        if (properties.barColourPicker) {
            if (settings.bars.custom) {
                settings.bars.colour = getColour(properties.barColourPicker.value);
                if (getBrightness(settings.bars.colour) > 240) {
                    defaultSrc = "BlackLogo.png"
                } else {
                    defaultSrc = "Logo.png"
                }
                if (!settings.logo.custom) {
                    loadImage(logo, defaultSrc)
                }
            }
        }
        if (properties.barSmoothing) {
            settings.bars.smoothingFactor = properties.barSmoothing.value;
        }
        if (properties.barOffsetX) {
            settings.bars.offset.x = properties.barOffsetX.value;
        }
        if (properties.barOffsetY) {
            settings.bars.offset.y = properties.barOffsetY.value;
        }
        /******************/
        //Particle settings
        /******************/
        if (properties.particlesEnabled) {
            settings.particles.enabled = properties.particlesEnabled.value;
        }
        if (properties.particlesReact) {
            settings.particles.react = properties.particlesReact.value;
        }
        if (properties.particleAmount) {
            settings.particles.amount = properties.particleAmount.value;
            updateParticles();
        }
        if (properties.particleSpeed) {
            settings.particles.speed = properties.particleSpeed.value;
            updateParticles();
        }
        if (properties.particleDirection) {
            settings.particles.direction = properties.particleDirection.value;
        }
        /***************/
        //Audio settings
        /***************/
        if (properties.audioPeaks) {
            settings.audio.peak = properties.audioPeaks.value;
        }
        if (properties.audioEqualize) {
            settings.audio.equalize = properties.audioEqualize.value;
        }
        if (properties.logoEnabled) {
            settings.logo.enabled = properties.logoEnabled.value;
        }
        if (properties.logoCustom) {
            settings.logo.custom = properties.logoCustom.value;
            if (!settings.logo.custom) loadImage(logo, defaultSrc)
        }
        if (properties.logoImage) {
            settings.logo.image = properties.logoImage.value;
            loadImage(logo, "file:///" + settings.logo.image);
        }
        if (properties.logoBackground) {
            settings.logo.background = properties.logoBackground.value;
        }
        if (properties.logoScale) {
            settings.logo.scale = properties.logoScale.value;
        }
        if (properties.logoOffsetX) {
            settings.logo.offset.x = properties.logoOffsetX.value;
        }
        if (properties.logoOffsetY) {
            settings.logo.offset.y = properties.logoOffsetY.value;
        }
        /****************/
        //Header settings
        /****************/
        if (properties.headerText) {
            settings.header.text = properties.headerText.value;
        }
        if (properties.headerAlign) {
            settings.header.align = properties.headerAlign.value;
        }
        if (properties.headerSize) {
            settings.header.size = properties.headerSize.value;
        }
        if (properties.headerColour) {
            settings.header.colour = getColour(properties.headerColour.value);
        }
        if (properties.headerOffsetX) {
            settings.header.offset.x = properties.headerOffsetX.value;
        }
        if (properties.headerOffsetY) {
            settings.header.offset.y = properties.headerOffsetY.value;
        }
        /********************/
        //Sub Header settings
        /********************/
        if (properties.subheaderText) {
            settings.subheader.text = properties.subheaderText.value;
        }
        if (properties.subheaderAlign) {
            settings.subheader.align = properties.subheaderAlign.value;
        }
        if (properties.subheaderSize) {
            settings.subheader.size = properties.subheaderSize.value;
        }
        if (properties.subheaderColour) {
            settings.subheader.colour = getColour(properties.subheaderColour.value);
        }
        if (properties.subheaderOffsetX) {
            settings.subheader.offset.x = properties.subheaderOffsetX.value;
        }
        if (properties.subheaderOffsetY) {
            settings.subheader.offset.y = properties.subheaderOffsetY.value;
        }
        /*****************/
        //Spotify settings
        /*****************/
        if (properties.spotifyEnabled) {
            settings.spotify.enabled = properties.spotifyEnabled.value;
        }
        if (properties.spotifyToken) {
            settings.spotify.refreshToken = properties.spotifyToken.value;
            if(settings.spotify.enabled && (settings.spotify.accessToken == "" || settings.spotify.accessToken == undefined)) getToken();
        }
        if (properties.spotifyLogo) {
            settings.spotify.logoSync = properties.spotifyLogo.value;
        }
        if (properties.spotifyColour) {
            settings.spotify.colourSync = properties.spotifyColour.value;
        }
        if(properties.spotifyVibrant) {
            settings.spotify.vibrant = properties.spotifyVibrant.value;
            let colour;
            if(settings.spotify.vibrant) {
                Vibrant.from(logo.src).getPalette((err, palette) => {
                    if (err) {
                        colour = getAverageRGB(logo)
                    } else {
                        colour = { r: 0, g: 0, b: 0 }
                        colourAvg = getAverageRGB(logo)
                        colour.r = Math.min(palette.Vibrant._rgb[0] * settings.spotify.vibrancy / 100,  255)
                        colour.g = Math.min(palette.Vibrant._rgb[1] * settings.spotify.vibrancy / 100,  255)
                        colour.b = Math.min(palette.Vibrant._rgb[2] * settings.spotify.vibrancy / 100,  255)
                    }
                    settings.bars.colour = "rgb(" + colour.r + ", " + colour.g + ", " + colour.b + ")";                 
                })
            } else if (settings.spotify.colourSync) {
                colour = getAverageRGB(logo)
                settings.bars.colour = "rgb(" + colour.r + ", " + colour.g + ", " + colour.b + ")";  
            }
        }
        if (properties.spotifyVibrancy) {
            settings.spotify.vibrancy = properties.spotifyVibrancy.value;
            let colour;
            if(settings.spotify.vibrant) {
                Vibrant.from(logo.src).getPalette((err, palette) => {
                    if (err) {
                        colour = getAverageRGB(logo)
                    } else {
                        colour = { r: 0, g: 0, b: 0 }
                        colourAvg = getAverageRGB(logo)
                        colour.r = Math.min(palette.Vibrant._rgb[0] * settings.spotify.vibrancy / 100,  255)
                        colour.g = Math.min(palette.Vibrant._rgb[1] * settings.spotify.vibrancy / 100,  255)
                        colour.b = Math.min(palette.Vibrant._rgb[2] * settings.spotify.vibrancy / 100,  255)
                    }
                    settings.bars.colour = "rgb(" + colour.r + ", " + colour.g + ", " + colour.b + ")";                 
                })
            } else if (settings.spotify.colourSync) {
                colour = getAverageRGB(logo)
                settings.bars.colour = "rgb(" + colour.r + ", " + colour.g + ", " + colour.b + ")";  
            }
        }
        if (properties.spotifyUpdate) {
            settings.spotify.updateRate = properties.spotifyUpdate.value;
        }
        if (properties.spotifyShorten) {
            settings.spotify.shortenTitle = properties.spotifyShorten.value;
        }
        if (properties.spotifySwap) {
            settings.spotify.swapTitle = properties.spotifySwap.value;
        }
        if (properties.spotifyProgress) {
            settings.spotify.progressBar = properties.spotifyProgress.value;
        }
        if (properties.spotifyProgressX) {
            settings.spotify.progress.offset.x = properties.spotifyProgressX.value;
        }
        if (properties.spotifyProgressY) {
            settings.spotify.progress.offset.y = properties.spotifyProgressY.value;
        }
        if (properties.spotifyProgressCustom) {
            settings.spotify.progress.custom = properties.spotifyProgressCustom.value;
        }
        if (properties.spotifyProgressWidth) {
            settings.spotify.progress.size.width = properties.spotifyProgressWidth.value
        }
        if (properties.spotifyProgressHeight) {
            settings.spotify.progress.size.height = properties.spotifyProgressHeight.value
        }
        if (properties.backgroundEnabled) {
            settings.background.enabled = properties.backgroundEnabled.value;
            if (settings.background.enabled && settings.background.src) {
                canvas.style.background = "url('file:///" + settings.background.src + "')";
                canvas.style.backgroundPosition="center";
                canvas.style.backgroundSize="100% 100%";
                canvas.style.backgroundRepeat="no-repeat";
            } else {
                canvas.style.background = "none";
            }
        }
        if (properties.backgroundSrc) {
            settings.background.src = properties.backgroundSrc.value;
            if (settings.background.enabled && settings.background.src) {
                canvas.style.background = "url('file:///" + settings.background.src + "')";
                canvas.style.backgroundPosition="center";
                canvas.style.backgroundSize="100% 100%";
                canvas.style.backgroundRepeat="no-repeat";
            } else {
                canvas.style.background = "none";
            }
        }
        if (properties.backgroundColour && !settings.background.enabled) {
            settings.background.colour = getColour(properties.backgroundColour.value);
            canvas.style.background = settings.background.colour;
        }
    }
}