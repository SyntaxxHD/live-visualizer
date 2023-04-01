const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let bars = [];
let particles = [];
let peakValue = 0.2;
const barsLength = 64;

let logo = new Image();

const audioIncrease = 0.02;
const audioDecrease = 0.98;

let defaultSrc = "Logo.png";

let settings = {
    bars: {
        width: 20,
        padding: 5,
        smoothingFactor: 8,
        custom: false,
        colour: "#00FF00",
        offset: {
            x: 0,
            y: 0
        }
    },
    particles: {
        enabled: true,
        amount: 50,
        speed: 2,
        direction: "Right",
        react: true
    },
    audio: {
        peak: 2,
        equalize: false,
    },
    logo: {
        enabled: true,
        custom: false,
        background: true,
        scale: 1,
        offset: {
            x: 0,
            y: 0,
        }
    },
    header: {
        text: "Header",
        centred: false,
        size: 100,
        colour: "#FFF",
        offset: {
            x: 0,
            y: 0
        }
    },
    subheader: {
        text: "Hello",
        centred: false,
        size: 50,
        colour: "#FFF",
        offset: {
            x: 0,
            y: 0
        }
    },
    spotify: {
        enabled: false,
        refreshToken: "",
        accessToken: "",
        colourSync: false,
        logoSync: false,
        updateRate: 5,
        shortenTitle: false,
        swapTitle: false,
        vibrant: false,
        vibrancy: 0,
        progressBar: false,
        progress: {
            offset: {
                x: 0,
                y: 0
            },
            custom: false,
            size: {
                width: 50,
                height: 2
            }
        }
    },
    background: {
        enabled: false,
        src: undefined,
        colour: "#000"
    }
}

const pinknoise = [1.1760367470305, 0.85207379418243, 0.68842437227852, 0.63767902570829, 0.5452348949654, 0.50723325864167, 0.4677726234682, 0.44204182748767,
    0.41956517802157, 0.41517375040002, 0.41312118577934, 0.40618363960446, 0.39913707474975, 0.38207008614508, 0.38329789106488, 0.37472136606245,
    0.36586428412968, 0.37603017335105, 0.39762590761573, 0.39391828858591, 0.37930603769622, 0.39433365764563, 0.38511504613859, 0.39082579241834,
    0.3811852720504, 0.40231453727161, 0.40244151133175, 0.39965366884521, 0.39761103827545, 0.51136400422212, 0.66151212038954, 0.66312205226679,
    0.7416276690995, 0.74614971301133, 0.84797007577483, 0.8573583910469, 0.96382997811663, 0.99819377577185, 1.0628692615814, 1.1059083969751,
    1.1819808497335, 1.257092297208, 1.3226521464753, 1.3735992532905, 1.4953223705889, 1.5310064942373, 1.6193923584808, 1.7094805527135,
    1.7706604552218, 1.8491987941428, 1.9238418849406, 2.0141596921333, 2.0786429508827, 2.1575522518646, 2.2196355526005, 2.2660112509705,
    2.320762171749, 2.3574848254513, 2.3986127976537, 2.4043566176474, 2.4280476777842, 2.3917477397336, 2.4032522546622, 2.3614180150678
];

const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
}

const loadImage = (elem, image, callback) => {
    if (image == "file:///" || image == undefined || image == "file:///undefined") {
        image = defaultSrc;
    }
    elem.loaded = false;
    elem.src = image;
    elem.onload = () => {
        elem.loaded = true
        if (typeof callback == "function") {
            callback(image)
        }
    }

}

const getAverageRGB = (imgEl) => {
    let blockSize = 10,
        defaultRGB = {
            r: 0,
            g: 0,
            b: 0
        },
        canvas = document.createElement('canvas'),
        context = canvas.getContext && canvas.getContext('2d'),
        data, width, height,
        i = -4,
        length,
        rgb = {
            r: 0,
            g: 0,
            b: 0
        },
        count = 0;

    if (!context) {
        return defaultRGB;
    }

    height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
    width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

    context.drawImage(imgEl, 0, 0);

    try {
        data = context.getImageData(0, 0, width, height);
    } catch (e) {
        return defaultRGB;
    }

    length = data.data.length;

    while ((i += blockSize * 4) < length) {
        ++count;
        rgb.r += data.data[i];
        rgb.g += data.data[i + 1];
        rgb.b += data.data[i + 2];
    }

    rgb.r = ~~(rgb.r / count);
    rgb.g = ~~(rgb.g / count);
    rgb.b = ~~(rgb.b / count);

    return rgb;

}

const getColour = (clr) => {
    let colour = clr.split(" ")
    for (let i = 0; i < colour.length; i++) {
        colour[i] = (colour[i] * 255).toString(16);
        if (colour[i].length == 1) {
            colour[i] = "0" + colour[i];
        }
    }
    colour = colour.join("");
    colour = "#" + colour;
    return colour;
}

const getBrightness = (colour) => {
    var c = colour.toString().substring(1);
    var rgb = parseInt(c, 16);
    var r = (rgb >> 16) & 0xff;
    var g = (rgb >> 8) & 0xff;
    var b = (rgb >> 0) & 0xff;

    var brightness = Math.round((r * 299 + g * 587 + b * 114) / 1000);
    return brightness
    if (brightness > 240) {
        user.logo = blackLogo;
    } else {
        user.logo = logo;
    }
}


function fftData(audioData) {
    let max = 0;
    let data = [];
    let finalProcessing = [];
    let average = 0;

    for (let i = 0; i < audioData.length / 2; i++) {
        data.push(Math.pow((audioData[i] + audioData[i + 1]) / 2, settings.audio.peak))
        if (settings.audio.equalize) {
            data[i] /= pinknoise[i];
        }
        if (data[i] > max) {
            max = data[i]
        }
    }

    peakValue = peakValue * audioDecrease + max * audioIncrease;
    for (let i = 0; i < data.length; i++) {
        data[i] /= peakValue;
        if (data[i] > 1.2) {
            data[i] = 1.2;
        }
    }

    for (let i = 0; i < data.length; i++) {
        if (i == 0 || i == data.length - 1) {
            finalProcessing[i] = data[i];
        } else {
            finalProcessing[i] = (data[i - 1] * 2 + data[i] * 3 + data[i + 1] * 2) / 7;
        }
        average += finalProcessing[i];
    }
    average /= finalProcessing.length;
    average *= settings.audio.peak * settings.particles.speed;
    if (settings.particles.react) {
        for (let i = 0; i < particles.length; i++) {
            particles[i].changedSpeedX = particles[i].speedX * (average + 0.1);
            particles[i].changedSpeedY = particles[i].speedY * (average + 0.1);
        }
    } else {
        for (let i = 0; i < particles.length; i++) {
            particles[i].changedSpeedX = particles[i].speedX * settings.particles.speed / 10;
            particles[i].changedSpeedY = particles[i].speedY * settings.particles.speed / 10;
        }
    }

    for (let i = 0; i < bars.length; i++) {
        bars[i].desiredPos = finalProcessing[i] * canvas.height / 3 + 1;
    }
}

window.registerFFTDataListener()

const updateBars = () => {
    for (let i = 0; i < bars.length; i++) {
        bars[i].x = canvas.width / 2 - (barsLength * (settings.bars.width + settings.bars.padding)) / 2 + i * (settings.bars.width + settings.bars.padding)
        bars[i].y = canvas.height / 2 - 25
        bars[i].width = settings.bars.width
        bars[i].height = 25
    }
}

const updateParticles = () => {
    if (settings.particles.amount > particles.length) {
        while (particles.length < settings.particles.amount) {
            particles.push(new Particle());
        }
    } else {
        var diff = particles.length - settings.particles.amount;
        particles.splice(-diff, diff);
    }
}

window.onload = () => {
    resize();
    for (let i = 0; i < barsLength; i++) {
        bars.push(new Bar(
            canvas.width / 2 - (barsLength * (settings.bars.width + settings.bars.padding)) / 2 + i * (settings.bars.width + settings.bars.padding),
            canvas.height / 2 - 25,
            settings.bars.width,
            25
        ))
    }
    if (settings.logo.enabled && !settings.logo.custom) {
        loadImage(logo, defaultSrc)
    } else if (settings.logo.image) {
        loadImage(logo, settings.logo.image);
    }

    if(settings.spotify.enabled && (settings.spotify.accessToken == "" || settings.spotify.accessToken == undefined)) getToken();

    for (let i = 0; i < settings.particles.amount; i++) {
        particles.push(new Particle());
    }
    window.requestAnimationFrame(draw);
}


const draw = () => {
    window.requestAnimationFrame(draw);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (settings.spotify.enabled) {
        if (settings.spotify.accessToken == "" || settings.spotify.accessToken == undefined) {
            getToken();
        } else if (Date.now() - spotify.dataTimer > settings.spotify.updateRate * 1000) {
            spotify.dataTimer = Date.now();
            getSpotifyData();
        }
    }
    if (settings.particles.enabled) {
        for (let i = 0; i < particles.length; i++) {
            particles[i].draw();
            particles[i].update(); 
        }
    }
    ctx.fillStyle = settings.bars.colour;
    for (let i = 0; i < bars.length; i++) {
        bars[i].draw(settings.bars.offset.x, settings.bars.offset.y);
        bars[i].update();
    }
    if (settings.logo.enabled && logo.loaded) {
        if (settings.logo.background) {
            ctx.fillRect(canvas.width / 2 - (barsLength * (settings.bars.width + settings.bars.padding)) / 2 + settings.logo.offset.x, canvas.height / 2 + 30 * settings.logo.scale + settings.logo.offset.y, 190 * settings.logo.scale, 190 * settings.logo.scale)
        }
        ctx.drawImage(
            logo,
            canvas.width / 2 - (barsLength * (settings.bars.width + settings.bars.padding)) / 2 + (settings.logo.custom ? 20 * settings.logo.scale : 0) + settings.logo.offset.x,
            canvas.height / 2 + (settings.logo.custom ? 50 * settings.logo.scale : 30 * settings.logo.scale) + settings.logo.offset.y,
            (settings.logo.custom ? 150 * settings.logo.scale : 190 * settings.logo.scale),
            (settings.logo.custom ? 150 * settings.logo.scale : 190 * settings.logo.scale))
    }
    if (settings.spotify.progressBar) {
        if (spotify.duration && spotify.position) {
            ctx.fillStyle = settings.bars.colour;
            if (!settings.spotify.progress.custom) {
                ctx.fillRect(canvas.width / 2 - (barsLength * (settings.bars.width + settings.bars.padding)) / 2 + settings.spotify.progress.offset.x, canvas.height / 2 + 10 + settings.spotify.progress.offset.y, spotify.position / spotify.duration * (barsLength * (settings.bars.width + settings.bars.padding)), 10);
            } else {
                ctx.fillRect(canvas.width / 2 - (barsLength * (settings.bars.width + settings.bars.padding)) / 2 + settings.spotify.progress.offset.x, canvas.height / 2 + 10 + settings.spotify.progress.offset.y, spotify.position / spotify.duration * (canvas.width / 100 * settings.spotify.progress.size.width), canvas.height / 100 * settings.spotify.progress.size.height);
            }
        }
    }
    ctx.font = settings.header.size + "px Gotham-Bold";
    ctx.textBaseline = 'middle';
    ctx.textAlign = settings.header.align;
    ctx.fillStyle = settings.header.colour;
    ctx.fillText(settings.header.text.toUpperCase(), canvas.width / 2 - (barsLength * (settings.bars.width + settings.bars.padding)) / 2 + 218 * settings.logo.scale + settings.header.offset.x, canvas.height / 2 + 90 + settings.header.offset.y)

    ctx.font = settings.subheader.size + "px Gotham-Light";
    ctx.textBaseline = 'middle';
    ctx.textAlign = settings.subheader.align;
    ctx.fillStyle = settings.subheader.colour;
    ctx.fillText(settings.subheader.text.toUpperCase(), canvas.width / 2 - (barsLength * (settings.bars.width + settings.bars.padding)) / 2 + 218 * settings.logo.scale + settings.subheader.offset.x, canvas.height / 2 + 170 + settings.subheader.offset.y)
}