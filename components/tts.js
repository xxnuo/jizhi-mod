let expiredAt = null;
let endpoint = null;
let clientId = "76a75279-2ffa-4c3d-8db8-7b47252aa41c";

async function getEndpoint() {
  const endpointUrl = "https://dev.microsofttranslator.com/apps/endpoint?api-version=1.0";
  const headers = {
    "Accept-Language": "zh-Hans",
    "X-ClientVersion": "4.0.530a 5fe1dc6c",
    "X-UserId": "0f04d16a175c411e",
    "X-HomeGeographicRegion": "zh-Hans-CN",
    "X-ClientTraceId": clientId,
    "X-MT-Signature": await sign(endpointUrl),
    "User-Agent": "okhttp/4.5.0",
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": "0",
    "Accept-Encoding": "gzip",
  };
  return fetch(endpointUrl, {
    method: "POST",
    headers: headers,
  }).then((res) => res.json());
}

async function sign(urlStr) {
  const url = urlStr.split("://")[1];
  const encodedUrl = encodeURIComponent(url);
  const uuidStr = uuid();
  const formattedDate = dateFormat();
  const bytesToSign = `MSTranslatorAndroidApp${encodedUrl}${formattedDate}${uuidStr}`.toLowerCase();
  const decode = await base64ToBytes2(
    "oik6PdDdMnOXemTbwvMn9de/h9lFnfBaCWbGMMZqqoSaQaqUOqjVGm5NqsmjcBI1x+sS9ugjB55HEJWRiFXYFw=="
  );
  const signData = await hmacSha256(decode, bytesToSign);
  const signBase64 = await bytesToBase64(signData);
  return `MSTranslatorAndroidApp::${signBase64}::${formattedDate}::${uuidStr}`;
}

function dateFormat() {
  const formattedDate = new Date().toUTCString().replace(/GMT/, "").trim() + "GMT";
  return formattedDate.toLowerCase();
}

async function getVoice(
  text,
  voiceName = "zh-CN-XiaoqiuNeural",
  rate = -25,
  pitch = 3,
  outputFormat = "audio-24khz-48kbitrate-mono-mp3",
  download = false
) {
  if (!expiredAt || Date.now() / 1e3 > expiredAt - 60) {
    endpoint = await getEndpoint();
    const jwt = endpoint.t.split(".")[1];
    const decodedJwt = JSON.parse(atob(jwt));
    expiredAt = decodedJwt.exp;
    const seconds = expiredAt - Date.now() / 1e3;
    clientId = uuid();
    console.log("getEndpoint, expiredAt:" + seconds / 60 + "m left");
  } else {
    const seconds = expiredAt - Date.now() / 1e3;
    console.log("expiredAt:" + seconds / 60 + "m left");
  }
  const url = `https://${endpoint.r}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const headers = {
    Authorization: endpoint.t,
    "Content-Type": "application/ssml+xml",
    "User-Agent": "okhttp/4.5.0",
    "X-Microsoft-OutputFormat": outputFormat,
  };
  const ssml = getSsml(text, voiceName, rate, pitch);
  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: ssml,
  });
  if (response.ok) {
    if (!download) {
      return response;
    }
    resp = new Response(response.body, response);
    resp.headers.set("Content-Disposition", `attachment; filename="${uuid()}.mp3"`);
    return resp;
  } else {
    return new Response(response.statusText, { status: response.status });
  }
}

function getSsml(text, voiceName, rate, pitch) {
  return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" version="1.0" xml:lang="zh-CN"> <voice name="${voiceName}"> <mstts:express-as style="general" styledegree="1.0" role="default"> <prosody rate="${rate}%" pitch="${pitch}%" volume="50">${text}</prosody> </mstts:express-as> </voice> </speak>`;
}

async function hmacSha256(key, data) {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: { name: "SHA-256" } }, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
  return new Uint8Array(signature);
}

async function base64ToBytes2(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function bytesToBase64(bytes) {
  const base64 = btoa(String.fromCharCode.apply(null, bytes));
  return base64;
}

function uuid() {
  return crypto.randomUUID().replace(/-/g, "");
}

export { getVoice };
