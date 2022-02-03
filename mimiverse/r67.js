var JSON_RPC_ENDPOINT = "https://api.avax.network/ext/bc/C/rpc";
var update_nonce = 0;
var retry_delay_ms = 2E3;
telegram_link = telegram_link.replace("t.me", "telegram.me");
var stats_downloaded = false;
var stats_refresh_interval_ms = 3E4;
var d = false;

function stats_ready(fn) {
    if (stats_downloaded === true) fn();
    else setTimeout(function () {
        stats_ready(fn)
    }, 4)
}

function getStats() {
    ajax("https://opendefi.app/stor/stor_data/objects/" + clientid + "_oracle65_stats.txt?none=" + Date.now(), null, function (res) {
        bpx.say("");
        try {
            var o = JSON.parse(res);
            d = o;
            stats_downloaded = true;
            $$("total_rewards").innerHTML = d.total_dividends_dispensed.toFixed(reward_display_decimals) + " " + reward_symbol;
            $$("total_rewards_usd").innerHTML = "$" + d.total_dividends_dispensed_usd.toFixed(rewards_in_usd_display_decimals) + " (USD)";
            $$(".stats_price").foreach(function (node) {
                node.innerHTML = "$" + d.token_price.toFixed(token_price_display_decimals)
            });
            $$(".stats_mcap").foreach(function (node) {
                node.innerHTML = "$" + d.market_cap.toFixed(mcap_display_decimals)
            });
            setTimeout(function () {
                getStats()
            }, stats_refresh_interval_ms)
        } catch (e) {
            setTimeout(function () {
                getStats()
            }, 3E3)
        }
    }, function () {
        setTimeout(function () {
            getStats()
        }, 3E3)
    }, function () {
        bpx.say("Retrieving token stats...")
    });
    return false
}

function clearAll() {
    $$("rewards").innerHTML = "...";
    $$("balance").innerHTML = "...";
    $$("pending_payout").innerHTML = "...";
    $$("daily").innerHTML = "...";
    $$("monthly").innerHTML = "...";
    $$("weekly").innerHTML = "...";
    $$("rewards_usd").innerHTML = "";
    $$("balance_usd").innerHTML = "";
    $$("pending_payout_usd").innerHTML = "";
    $$("daily_usd").innerHTML = "";
    $$("monthly_usd").innerHTML = "";
    $$("weekly_usd").innerHTML = "";
    $$("toggleViewBalanceBtn").hide();
    $$("reward_refresh_btn").hide()
}
var saved_rewards = 0;

function getr(address) {
    clearAll();
    ajaxJSON(JSON_RPC_ENDPOINT, {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_call",
        "params": [{
            "from": "0x0000000000000000000000000000000000000000",
            "data": "0xce7c2ac2000000000000000000000000" + address.substr(2),
            "to": distributor_ca
        }, "latest"]
    }, function (res) {
        say();
        try {
            var o = JSON.parse(res);
            var all = o.result.substr(2);
            var line3 = getLine(all, 2, 64);
            var rewards = hex2decimal(line3) / Math.pow(10, reward_token_decimals);
            saved_rewards = rewards;
            var usd = rewards * d.reward_token_price;
            $$("rewards").innerHTML =
                rewards.toFixed(reward_display_decimals) + " " + reward_symbol;
            $$("reward_refresh_btn").show("inline-block");
            $$("rewards_usd").innerHTML = "$" + usd.toFixed(rewards_in_usd_display_decimals) + " (USD)";
            getb(address)
        } catch (e) {
            bpx.say("retrying...");
            setTimeout(function () {
                getr(address)
            }, retry_delay_ms)
        }
    }, function () {
        bpx.say("retrying...");
        setTimeout(function () {
            getr(address)
        }, retry_delay_ms)
    }, function () {
        bpx.say("connecting...")
    })
}
var balance = 0;

function getb(address) {
    ajaxJSON(JSON_RPC_ENDPOINT, {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_call",
        "params": [{
            "from": "0x0000000000000000000000000000000000000000",
            "data": "0x70a08231000000000000000000000000" + address.substr(2),
            "to": token_ca
        }, "latest"]
    }, function (res) {
        say();
        try {
            var o = JSON.parse(res);
            var bal = hex2decimal(o.result) / Math.pow(10, token_decimals);
            balance = bal;
            var usd = balance * d.token_price;
            $$("balance").innerHTML = balance.toFixed(token_display_decimals) + " " + token_symbol;
            $$("balance_usd").innerHTML = "$" +
                usd.toFixed(token_in_usd_display_decimals) + " (USD)";
            $$("toggleViewBalanceBtn").show("inline-block");
            var user24h = saved_rewards / d.total_dividends_dispensed * d.total_dispensed_24;
            var user24h_usd = user24h * d.reward_token_price;
            var user30d = user24h * 30;
            var user30d_usd = user30d * d.reward_token_price;
            var user7d = user24h * 7;
            var user7d_usd = user7d * d.reward_token_price;
            $$("daily").innerHTML = user24h.toFixed(reward_display_decimals) + " " + reward_symbol;
            $$("daily_usd").innerHTML = "$" + user24h_usd.toFixed(rewards_in_usd_display_decimals);
            $$("monthly").innerHTML = user30d.toFixed(reward_display_decimals) + " " + reward_symbol;
            $$("monthly_usd").innerHTML = "$" + user30d_usd.toFixed(rewards_in_usd_display_decimals);
            $$("weekly").innerHTML = user7d.toFixed(reward_display_decimals) + " " + reward_symbol;
            $$("weekly_usd").innerHTML = "$" + user7d_usd.toFixed(rewards_in_usd_display_decimals);
            getp(address)
        } catch (e) {
            bpx.say("retrying...");
            setTimeout(function () {
                getb(address)
            }, retry_delay_ms)
        }
    }, function () {
        bpx.say("retrying...");
        setTimeout(function () {
                getb(address)
            },
            retry_delay_ms)
    }, function () {
        bpx.say("connecting...")
    })
}

function getp(address) {
    if (!can_display_incoming_rewards) return false;
    ajaxJSON(JSON_RPC_ENDPOINT, {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_call",
        "params": [{
            "from": "0x0000000000000000000000000000000000000000",
            "data": "0x28fd3198000000000000000000000000" + address.substr(2),
            "to": distributor_ca
        }, "latest"]
    }, function (res) {
        say();
        try {
            var o = JSON.parse(res);
            var pending = hex2decimal(o.result) / Math.pow(10, reward_token_decimals);
            var usd = pending * d.reward_token_price;
            $$("pending_payout").innerHTML = pending.toFixed(reward_display_decimals) +
                " " + reward_symbol;
            $$("pending_payout_usd").innerHTML = "$" + usd.toFixed(rewards_in_usd_display_decimals) + " (USD)"
        } catch (e) {
            bpx.say("retrying...");
            setTimeout(function () {
                getp(address)
            }, retry_delay_ms)
        }
    }, function () {
        bpx.say("retrying...");
        setTimeout(function () {
            getp(address)
        }, retry_delay_ms)
    }, function () {
        bpx.say("connecting...")
    })
}

function checkUpdateNonce() {
    ajax("https://opendefi.app/stor/stor_data/objects/" + clientid + "_update_nonce.txt?x=" + time(), null, function (res) {
        try {
            var o = JSON.parse(res);
            if (update_nonce == 0) update_nonce = o.update_nonce;
            else if (o.update_nonce != update_nonce) document.location = "?update=" + o.update_nonce + "&new_version=" + time() + "&address=" + bpx.Q("address");
            setTimeout(function () {
                checkUpdateNonce()
            }, stats_refresh_interval_ms)
        } catch (e) {
            setTimeout(function () {
                checkUpdateNonce()
            }, stats_refresh_interval_ms)
        }
    }, function () {
        setTimeout(function () {
                checkUpdateNonce()
            },
            stats_refresh_interval_ms)
    }, function () {})
}

function postAddress() {
    document.location = "?address=" + $$("address").value.trim()
}

function submitAddress() {
    var address = bpx.Q("address");
    var a = address.split("#");
    address = a[0];
    str2av(address, "walletav");
    if (address.length < 2) {
        bpx.say("Invalid address", 3E3);
        return false
    }
    if (address.length >= 2) {
        if (address.substr(0, 2).toLowerCase() == "0x" && address.length < 10) {
            bpx.say("Invalid address", 3E3);
            return false
        }
        if (address.substr(0, 2).toLowerCase() != "0x") {
            bpx.say("Invalid address", 3E3);
            return false
        }
    }
    $$("address").value = "";
    var short_address = address.substr(0, 8) + "..." + address.substr(address.length - 4);
    $$(".address_line").hide();
    $$("wallet_address").innerHTML = short_address;
    $$("address_line_active").show("block");
    stats_ready(function () {
        getr(address)
    })
}

function toggleViewBalance() {
    if ($$("toggleViewBalanceBtn").innerHTML == "hide") {
        $$("toggleViewBalanceBtn").innerHTML = "show";
        $$("balance").innerHTML = "*************";
        $$("balance_usd").hide()
    } else {
        $$("toggleViewBalanceBtn").innerHTML = "hide";
        $$("balance").innerHTML = balance.toFixed(token_display_decimals) + " " + token_symbol;
        $$("balance_usd").show("inline-block")
    }
}
bpx.ready(function () {
    $$("token_ca").innerHTML = token_ca;
    update_nonce = bpx.Q("update");
    if (update_nonce == "") update_nonce = 0;
    $$(".closeable").foreach(function (node) {
        node.innerHTML += '<a href="javascript:" onclick="$$(\'.modal_container\').style.display=\'none\';" style="position:absolute; top:.75rem; right:.75rem;"><img src="dashboard/close.svg" alt=\'\' style="height:1.2rem;"></a>'
    });
    $$("contract_link").href = contract_link;
    $$("website_link").href = website_link;
    $$("telegram_link").href = telegram_link;
    $$("twitter_link").href =
        twitter_link;
    if (contract_link == "") $$("contract_link").hide();
    if (website_link == "") $$("website_link").hide();
    if (telegram_link == "") $$("telegram_link").hide();
    if (twitter_link == "") $$("twitter_link").hide();
    $$("token_display_name").innerHTML = client_name + " (" + token_symbol + ")";
    if ($$(".token_symbol")) $$(".token_symbol").foreach(function (node) {
        node.innerHTML = token_symbol
    });
    bpx.say("loading...");
    $$("bpx_say_div").style.filter = "";
    $$("bpx_say_div").style.background = "";
    $$("bpx_say_div").style.color = "";
    $$("bpx_say_div").style.boxShadow =
        "";
    $$("bpx_say_div").style.border = "";
    $$("bpx_say_div").addClass("notice");
    closeModal();
    setTimeout(function () {
        $$("blocker").hide()
    }, 1E3);
    checkUpdateNonce();
    getStats();
    var qaddress = bpx.Q("address");
    if (qaddress != "") {
        $$("address").value = qaddress;
        submitAddress()
    }
});

function showModal(id) {
    $$(".modal").hide();
    $$(".modal_container").style.display = "inline-block";
    if ($$(id)) {
        $$(id).removeClass("visible");
        $$(id).style.display = "inline-block";
        setTimeout(function () {
            $$(id).addClass("visible")
        }, 10)
    }
}

function closeModal() {
    $$(".modal").hide();
    $$(".modal_container").hide()
}
var chart_set = "mcap";
var chart_range = "24h";
var x;

function choose_set(set) {
    chart_set = set;
    $$(".charttype").removeClass("selected");
    $$("charttype" + set).addClass("selected");
    getdata()
}

function choose_range(range) {
    chart_range = range;
    $$(".chartinterval").removeClass("selected");
    $$("chartinterval" + range).addClass("selected");
    getdata()
}

function getdata() {
    return false;
    ajax("https://opendefi.app/stor/stor_data/samples/" + clientid + "_pmr_" + chart_range + ".txt", null, function (res) {
        bpx.say("Loading chart...", 300);
        try {
            var a = JSON.parse(res);
            var b = [];
            for (var i = a.length >= 100 ? a.length - 100 : 0; i < a.length; i++) b.push(a[i]);
            var mcaps = [];
            for (var i = 0; i < b.length; i++) {
                if (chart_set == "price") mcaps.push(b[i].value.p);
                if (chart_set == "mcap") mcaps.push(b[i].value.mc);
                if (chart_set == "rewards") mcaps.push(b[i].value.tr)
            }
            dc(mcaps, b[0].timestamp, b[Math.floor(b.length *
                .33)].timestamp, b[Math.floor(b.length * .67)].timestamp);
            $$("chart").show("inline-block")
        } catch (e) {
            $$("chart").hide();
            bpx.say("Chart data provider is busy at this time.", 3E3)
        }
    }, function () {
        bpx.say("Chart data provider is busy at this time.", 3E3)
    }, function () {
        bpx.say("Loading chart...")
    })
}

function dc(mcaps, date1ts, date2ts, date3ts) {
    x = nlc();
    x.canvasID = "ch";
    x.samples = mcaps;
    x.precision = 0;
    x.date1ts = date1ts;
    x.date2ts = date2ts;
    x.date3ts = date3ts;
    x.width = 800;
    x.height = 400;
    if (chart_set == "price") {
        x.title = client_name + " Price";
        x.stopDecimals = token_price_display_decimals;
        mcaps.push(d.token_price)
    }
    if (chart_set == "mcap") {
        x.title = client_name + " Market Cap";
        x.stopDecimals = mcap_display_decimals;
        mcaps.push(d.market_cap)
    }
    if (chart_set == "rewards") {
        x.title = client_name + " Rewards";
        x.stopDecimals = reward_display_decimals;
        mcaps.push(d.total_dividends_dispensed)
    }
    x.line1 = mcaps[mcaps.length - 1];
    if (chart_range == "24h") x.title += " 15m";
    if (chart_range == "7d") x.title += " 1h";
    if (chart_range == "30d") x.title += " 6h";
    if (chart_range == "3mo") x.title += " 1d";
    if (chart_range == "1yr") x.title += " 3d";
    if (chart_range == "2yrs") x.title += " 7d";
    x.fillColor = "rgba(0,0,0,.85)";
    windowResize()
}
window.addEventListener("resize", windowResize);

function rem2px(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

function windowResize() {
    var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    width -= rem2px(3);
    var maxwidth = rem2px(71);
    width = width > maxwidth ? maxwidth : width;
    width -= rem2px(2);
    x.width = width;
    x.height = 300;
    x.draw(100)
}

function str2av(str, cid) {
    if (str.substr(0, 2).toLowerCase() == "0x") str = str.substr(2);
    str = inflate(str, str2pin(str));
    var canvas = $$(cid);
    context = canvas.getContext("2d");
    canvas.width = 64;
    canvas.height = 64;
    var pixelSize = 8;
    context.clearRect(0, 0, canvas.width, canvas.height);
    var acolors = ["#c9e653", "#636fb2", "#adc4ff", "#47ecb7", "#ffccd7", "#ff7fbd", "#d23abe", "#e52d40", "#ef604a", "#ffd877", "#00cc8b", "#005a75", "#513ae8", "#19baff", "#7731a5", "#b97cff"];
    var colorset = [];
    for (var i = 0; i < 1; i++) {
        var ci = hex2decimal(str.substr(13,
            1));
        colorset.push(acolors[ci])
    }
    colorset.push("#ffffff");
    colorset.push("#1c2348");
    for (var i = 0; i < 3; i++) colorset.push(bpx.lighten(colorset[i], 10));
    colorset.push(colorset[5]);
    for (var i = 0; i < 3; i++) colorset.push(bpx.darken(colorset[i], 10));
    var pos = 0;
    for (var y = 0; y < 8; y++)
        for (x = 0; x < 8; x++) {
            ci = hex2decimal(str.substr(pos, 1));
            var color = colorset[ci];
            pos++;
            if (pos >= str.length) pos = 0;
            context.fillStyle = color;
            context.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
        }
}

function scrollTop() {
    return window.pageYOffset || document.body.scrollTop || 0
}

function rndoff(amount, places) {
    places = places === undefined ? 2 : places;
    var factor = Math.pow(10, places);
    return Math.round(amount * factor) / factor
}

function moneyFormat(labelValue, decimals) {
    decimals = decimals === undefined ? 2 : decimals;
    return Math.abs(Number(labelValue)) >= 1E9 ? (Math.abs(Number(labelValue)) / 1E9).toFixed(decimals) + "B" : Math.abs(Number(labelValue)) >= 1E6 ? (Math.abs(Number(labelValue)) / 1E6).toFixed(decimals) + "M" : Math.abs(Number(labelValue)) >= 1E3 ? (Math.abs(Number(labelValue)) / 1E3).toFixed(decimals) + "K" : Math.abs(Number(labelValue)).toFixed(decimals)
}

function pf(str, defaultValue) {
    defaultValue = defaultValue === undefined ? 0 : defaultValue;
    var res = parseFloat(str);
    if (isNaN(res)) return defaultValue;
    return res
}

function pixelSnap(val) {
    return Math.floor(val) + .5
}

function nlc(props) {
    var x = {
        canvasID: "",
        width: 500,
        height: 200,
        padding: 10,
        samples: [0, 250, 125, 500],
        floor: false,
        ceiling: false,
        smoothing: 1,
        stopRoundOff: 1,
        fillColor: "#111521",
        lineColor: "#1cd8b2",
        shadowColor: "#323a4f",
        trendColor: "#512939",
        maColor: "#315c53",
        greenCandle: "#1cd8b2",
        redCandle: "#ad24e6",
        lineWidth: 2,
        shadowOffset: -24,
        drawShadow: true,
        drawTrend: true,
        latestColor: "#c6cfe8",
        latestHeight: 24,
        font: "sans-serif",
        labelColor: "#949aab",
        labelHeight: 12,
        titleColor: "#c5cde5",
        titleHeight: 16,
        stopLinesColor: "#282f40",
        timezone: 8,
        timestampColor: "#aaaaaa",
        labelWidth: 20,
        customText: "",
        hideStops: false,
        stops: 5,
        precision: 5,
        line1color: "#ffbb00",
        line1: false,
        line2: false,
        line3: false,
        line4: false,
        prediction: 0,
        range: 0,
        stopDecimals: 12,
        lastSampleColor: "#111521"
    };
    for (var key in props) x[key] = props[key];
    x.draw = function (samplesFromEnd) {
        this.smoothing = this.smoothing >= 1 ? this.smoothing : 1;
        this.stopRoundOff = this.stopRoundOff >= 1 ? this.stopRoundOff : 1;
        if (!samplesFromEnd) samplesFromEnd = this.samples.length;
        samplesFromEnd = samplesFromEnd > this.samples.length ?
            this.samples.length : samplesFromEnd;
        var canvas = $$(this.canvasID);
        context = canvas.getContext("2d");
        canvas.width = this.width;
        canvas.height = this.height;
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (clientid != bpx.unblur("SaSayZ60Z")) return false;
        if (this.fillColor != "transparent") {
            context.fillStyle = this.fillColor;
            context.fillRect(0, 0, this.width, this.height)
        }
        context.font = this.labelHeight + "px " + this.font;
        var labelPadding = 0;
        for (var i = 0; i < this.samples.length; i++) {
            var displaytxt = this.samples[this.samples.length -
                1].toFixed(this.stopDecimals);
            var lp = context.measureText(displaytxt).width;
            if (lp > labelPadding) labelPadding = lp;
            if (labelPadding > this.labelWidth) this.labelWidth = labelPadding
        }
        if (this.hideStops === true) this.labelWidth = 0;
        var usableWidth = this.width - this.padding * 3 - this.labelWidth;
        var usableHeight = this.height - this.padding * 4 - this.labelHeight * 3 - this.titleHeight;
        var graphLeft = this.padding;
        var graphTop = this.padding * 3 + this.labelHeight * 2;
        context.translate(graphLeft, graphTop);
        var highest = 0;
        var lowest = Math.pow(10,
            20);
        for (var i = 0; i < this.samples.length; i++) {
            if (this.samples[i] > highest) highest = this.samples[i];
            if (this.samples[i] < lowest) lowest = this.samples[i]
        }
        this.ceiling = highest;
        this.floor = lowest;
        var cut = (highest - lowest) / this.stops;
        this.ceiling += cut / 2;
        this.floor -= cut / 2;
        var startSample = this.samples.length - samplesFromEnd;
        var endSample = this.samples.length - 1;
        var normalizedSamples = [];
        var rawSelection = [];
        var dist = this.ceiling - this.floor;
        for (var i = startSample; i <= endSample; i++) {
            rawSelection.push(this.samples[i]);
            normalizedSamples.push((this.samples[i] -
                this.floor) / dist * usableHeight)
        }
        var ma = [];
        var depth = rndoff(normalizedSamples.length * .25, 0);
        var ave = normalizedSamples[0];
        for (var i = 0; i < normalizedSamples.length; i++) {
            ma.push((normalizedSamples[i] + ave * (depth - 1)) / depth);
            ave = ma[i]
        }
        var smoother = [];
        var depth = rndoff(normalizedSamples.length * 1, 0);
        var ave = normalizedSamples[0];
        for (var i = 0; i < normalizedSamples.length; i++) {
            smoother.push((normalizedSamples[i] + ave * (depth - 1)) / depth);
            ave = smoother[i]
        }
        if (this.hideStops === false) {
            var lines = this.stops;
            var yStep = usableHeight /
                lines;
            var currentY = 0 - yStep;
            context.beginPath();
            for (var i = 1; i <= lines + 1; i++) {
                currentY += yStep;
                stopValue -= stopValueStep;
                currentY = currentY;
                context.moveTo(pixelSnap(0), pixelSnap(currentY));
                if (i == lines + 1) currentY = usableHeight;
                context.lineTo(pixelSnap(usableWidth), pixelSnap(currentY))
            }
            context.lineWidth = 1;
            context.strokeStyle = this.stopLinesColor;
            context.stroke()
        }
        if (this.hideStops === false) {
            var currentY = 0 - yStep;
            context.beginPath();
            context.moveTo(pixelSnap(0), pixelSnap(0));
            context.lineTo(pixelSnap(0), pixelSnap(usableHeight));
            context.moveTo(pixelSnap(usableWidth * .33 + 4), pixelSnap(0));
            context.lineTo(pixelSnap(usableWidth * .33 + 4), pixelSnap(usableHeight));
            context.moveTo(pixelSnap(usableWidth * .67 + 4), pixelSnap(0));
            context.lineTo(pixelSnap(usableWidth * .67 + 4), pixelSnap(usableHeight));
            context.moveTo(pixelSnap(usableWidth), pixelSnap(0));
            context.lineTo(pixelSnap(usableWidth), pixelSnap(usableHeight));
            context.lineWidth = 1;
            context.strokeStyle = this.stopLinesColor;
            context.stroke()
        }
        if (this.drawShadow) {
            this.shadowOffset = 0;
            var xStep = usableWidth /
                ma.length;
            context.beginPath();
            context.moveTo(0, usableHeight - ma[0] + this.shadowOffset);
            var currentStep = 0;
            var i;
            for (i = 0; i < ma.length - 2; i++) {
                currentStep += xStep;
                var xc = (currentStep + (currentStep + xStep)) / 2;
                var yc = (ma[i] + ma[i + 1]) / 2;
                context.quadraticCurveTo(currentStep, usableHeight - ma[i] + this.shadowOffset, xc, usableHeight - yc + this.shadowOffset)
            }
            context.quadraticCurveTo(currentStep + xStep, usableHeight - ma[i] + this.shadowOffset, currentStep + xStep + xStep, usableHeight - ma[i + 1] + this.shadowOffset);
            context.lineWidth = this.lineWidth;
            context.lineCap = "round";
            context.strokeStyle = this.shadowColor;
            context.stroke();
            context.closePath()
        }
        if (this.drawTrend) {
            context.beginPath();
            context.moveTo(0, usableHeight - normalizedSamples[0]);
            var currentStep = 0;
            var i;
            for (i = 0; i < smoother.length - 2; i++) {
                currentStep += xStep;
                var xc = (currentStep + (currentStep + xStep)) / 2;
                var yc = (smoother[i] + smoother[i + 1]) / 2;
                context.quadraticCurveTo(currentStep, usableHeight - smoother[i], xc, usableHeight - yc)
            }
            context.quadraticCurveTo(currentStep + xStep, usableHeight - smoother[i], currentStep +
                xStep + xStep, usableHeight - smoother[i + 1]);
            context.lineWidth = this.lineWidth;
            context.lineCap = "round";
            context.strokeStyle = this.trendColor;
            context.stroke();
            context.closePath()
        }
        var xStep = usableWidth / normalizedSamples.length;
        var candleY = usableHeight - normalizedSamples[0];
        var currentStep = 0;
        var i;
        var candleWidth = Math.floor(usableWidth / 100) - 2;
        context.lineCap = "square";
        for (i = 0; i < normalizedSamples.length - 2; i++) {
            var p1 = candleY;
            var p2 = usableHeight - normalizedSamples[i + 1];
            context.moveTo(currentStep, candleY);
            candleY =
                p2;
            currentStep += xStep;
            context.fillStyle = this.greenCandle;
            if (i > 0)
                if (p1 <= p2) context.fillStyle = this.redCandle;
            if (p1 > p2) {
                px = p1;
                p1 = p2;
                p2 = px
            }
            var h = p2 - p1;
            if (h < 1) h = 1;
            if (candleWidth < 1) candleWidth = 1;
            context.fillRect(Math.floor(currentStep), Math.floor(p1), Math.floor(candleWidth), Math.floor(h))
        }
        if (this.drawLine) {
            var xStep = usableWidth / normalizedSamples.length;
            context.beginPath();
            context.moveTo(0, usableHeight - normalizedSamples[0]);
            var currentStep = 0;
            var i;
            for (i = 0; i < normalizedSamples.length - 2; i++) {
                currentStep += xStep;
                var xc = (currentStep + (currentStep + xStep)) / 2;
                var yc = (normalizedSamples[i] + normalizedSamples[i + 1]) / 2;
                context.quadraticCurveTo(currentStep, usableHeight - normalizedSamples[i], xc, usableHeight - yc)
            }
            context.quadraticCurveTo(currentStep + xStep, usableHeight - normalizedSamples[i], currentStep + xStep + xStep, usableHeight - normalizedSamples[i + 1]);
            context.lineWidth = this.lineWidth;
            context.lineCap = "round";
            context.strokeStyle = this.lineColor;
            context.stroke();
            context.closePath()
        }
        if (this.hideStops === false) {
            var yStep = usableHeight /
                lines;
            var currentY = 0 - yStep;
            var stopValueStep = dist / lines;
            var stopValue = this.ceiling + stopValueStep;
            var lastLabel = "";
            for (var i = 1; i <= lines + 1; i++) {
                currentY += yStep;
                stopValue -= stopValueStep;
                context.font = this.labelHeight + "px " + this.font;
                context.fillStyle = this.labelColor;
                var txt = stopValue.toFixed(this.stopDecimals);
                if (txt != lastLabel) context.fillText(txt, usableWidth + this.padding, currentY + this.labelHeight / 2 - 2);
                lastLabel = txt
            }
        }
        context.beginPath();
        context.setLineDash([1, 3]);
        context.moveTo(pixelSnap(0), pixelSnap(candleY));
        context.lineTo(pixelSnap(usableWidth), pixelSnap(candleY));
        context.lineCap = "square";
        context.lineWidth = 1;
        context.strokeStyle = this.line1color;
        context.stroke();
        context.setLineDash([]);
        context.fillStyle = this.line1color;
        context.fillRect(Math.floor(usableWidth), Math.floor(candleY - this.labelHeight / 2) - 4, Math.floor(this.width - usableWidth), Math.floor(this.labelHeight) + 8);
        context.font = this.labelHeight + "px " + this.font;
        context.fillStyle = this.lastSampleColor;
        var txt = this.line1.toFixed(this.stopDecimals);
        context.fillText(txt,
            usableWidth + this.padding, candleY + this.labelHeight / 2 - 2);
        context.font = this.labelHeight + "px " + this.font;
        context.fillStyle = this.labelColor;
        context.textAlign = "left";
        context.fillText(getFriendlyTime(this.date1ts), 0, usableHeight + this.padding + this.labelHeight);
        context.fillText(getFriendlyTime(this.date2ts), usableWidth * .33 + 4, usableHeight + this.padding + this.labelHeight);
        context.fillText(getFriendlyTime(this.date3ts), usableWidth * .67 + 4, usableHeight + this.padding + this.labelHeight);
        context.translate(0 - graphLeft,
            0 - graphTop);
        context.fillStyle = this.fillColor;
        context.clearRect(0, 0, Math.floor(usableWidth), this.labelHeight + this.padding * 3 + this.labelHeight);
        context.fillRect(0, 0, Math.floor(usableWidth), this.labelHeight + this.padding * 3 + this.labelHeight);
        context.font = this.titleHeight + "px " + this.font;
        context.fillStyle = this.titleColor;
        var txt = this.title;
        var lastTxtX = this.padding;
        var lastTxtWidth = context.measureText(txt).width;
        context.fillText(txt, lastTxtX, this.padding * 2.5);
        context.font = this.labelHeight + "px " + this.font;
        context.fillStyle = this.labelColor;
        var datestr = (new Date(time() * 1E3)).toUTCString();
        datestr = datestr.replace("GMT", "UTC");
        context.fillText(datestr, lastTxtX + lastTxtWidth + this.padding, this.padding * 2.5);
        context.translate(0, 0);
        context.fillStyle = this.shadowColor;
        var lastSquareX = this.padding;
        var lastY = this.padding * 2 + this.titleHeight;
        context.fillRect(lastSquareX, lastY, 10, 10);
        context.font = this.labelHeight + "px " + this.font;
        context.fillStyle = this.labelColor;
        var txt = "MA 25";
        var lastTxtWidth = context.measureText(txt).width;
        var lastTxtX = lastSquareX + 18;
        context.fillText(txt, lastTxtX, lastY + this.padding);
        context.fillStyle = this.trendColor;
        lastSquareX = lastTxtX + lastTxtWidth + this.padding * 2;
        context.fillRect(lastSquareX, lastY, 10, 10);
        context.font = this.labelHeight + "px " + this.font;
        context.fillStyle = this.labelColor;
        var txt = "MA 100";
        lastTxtWidth = context.measureText(txt).width;
        lastTxtX = lastSquareX + 18;
        context.fillText(txt, lastTxtX, lastY + this.padding)
    };
    return x
};