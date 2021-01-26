var debug = !1,
  rules = [];

localStorage["at.flansch.modifycontenttype.rules"] && (rules = JSON.parse(localStorage["at.flansch.modifycontenttype.rules"]), $.each(rules, function(b, a) {
  a.urlRE = RegExp(a.urlRE);
  a.matchRE = RegExp(a.matchRE)
}));

chrome.webRequest.onHeadersReceived.addListener(function(b) {
  var a, c = [];
  for (a = 0; a < rules.length; a++) rules[a].urlRE.test(b.url) && c.push(a);
  if (0 < c.length) {
    var e = -1,
      d = -1;
    for (a = 0; a < b.responseHeaders.length; a++) switch (b.responseHeaders[a].name.toLowerCase()) {
      case "content-type":
        e = a;
        break;
      case "content-disposition":
        d = a
    }
    if (-1 < e)
      for (a = 0; a < c.length; a++)
        if (rules[c[a]].matchRE.test(b.responseHeaders[e].value)) {
          debug && console.log("modified header", b.responseHeaders[e].value, rules[c[a]].replaceText);
          b.responseHeaders[e].value =
            rules[c[a]].replaceText;
          "<remove>" == rules[c[a]].disposition && -1 < d ? (debug && console.log("removed disposition"), b.responseHeaders.splice(d, 1)) : "<unchanged>" != rules[c[a]].disposition && (-1 < d ? (b.responseHeaders[d].value = rules[c[a]].disposition, debug && console.log("modified disposition", b.responseHeaders[d].value, rules[c[a]].disposition)) : (b.responseHeaders.push({
            name: "content-disposition",
            value: rules[c[a]].disposition
          }), debug && console.log("added disposition", rules[c[a]].disposition)));
          break
        }
  }
  return {
    responseHeaders: b.responseHeaders
  }
}, {
  urls: ["<all_urls>"],
  types: ["main_frame", "sub_frame"]
}, ["blocking", "responseHeaders"]);

chrome.runtime.onMessage.addListener(function(b, a, c) {
  debug && console.log("message received" + (b && b.type ? b.type : "request object empty"));
  b && "ruleschanged" == b.type && (rules = b.data, $.each(rules, function(a, b) {
    b.urlRE = RegExp(b.urlRE);
    b.matchRE = RegExp(b.matchRE)
  }))
});
