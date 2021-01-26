$(function() {
  var a = [];
  localStorage["at.flansch.modifycontenttype.rules"] && (a = JSON.parse(localStorage["at.flansch.modifycontenttype.rules"]), $.each(a, function(e, a) {
    DrawRule(a.name, a.urlRE, a.matchRE, a.replaceText, a.disposition)
  }));
  $(".addButton").click(function() {
    $("#inputForm").show();
    $("#inputForm input")[0].focus()
  });
  $(".dlgAddButton").click(function() {
    var a = $("#inputForm input[type='text']"),
      b = $("#inputForm input[type='hidden']")[0];
    if (a[1].value && a[2].value && a[3].value) {
      a[0].value || (a[0].value =
        "<unnamed rule>");
      a[4].value || (a[4].value = "<unchanged>");
      if (b.value) {
        var c = $("#ruleList li")[parseInt(b.value)],
          b = $(c).find("h2"),
          c = $(c).find("td:last-child");
        $(b).text(a[0].value);
        $(c[0]).text(a[1].value);
        $(c[1]).text(a[2].value);
        $(c[2]).text(a[3].value);
        $(c[3]).text(a[4].value)
      } else DrawRule(a[0].value, a[1].value, a[2].value, a[3].value, a[4].value);
      $("#inputForm input[type='text']").val("");
      $("#inputForm input[type='hidden']").val("");
      $("#inputForm").hide();
      SaveRules()
    } else alert("Required fields missing!")
  });
  $(".dlgCancelButton").click(function() {
    $("#inputForm input[type='text']").val("");
    $("#inputForm input[type='hidden']").val("");
    $("#inputForm").hide()
  })
});

function HTMLEncode(a) {
  return $("<div/>").text(a).html()
}

function DrawRule(a, e, b, c, d) {
  a = $("<li><h2>" + HTMLEncode(a) + '</h2> <input class="editButton" type="button" value="Edit Rule"/> <input class="removeButton" type="button" value="Remove Rule"/><table><tr><td>URL Filter:</td><td>' + HTMLEncode(e) + "</td></tr><tr><td>Original Type:</td><td>" + HTMLEncode(b) + "</td></tr><tr><td>Replacement Type:</td><td>" + HTMLEncode(c) + "</td></tr><tr><td>Disposition:</td><td>" + HTMLEncode(d) + "</td></tr></table></li>");
  a.find(".editButton").click(function() {
    var a = $(this).parent("li")[0],
      c = $(a).find("h2"),
      b = $(a).find("td:last-child"),
      d = $("#inputForm input[type='text']");
    d[0].value = $(c).text();
    d[1].value = $(b[0]).text();
    d[2].value = $(b[1]).text();
    d[3].value = $(b[2]).text();
    d[4].value = $(b[3]).text();
    c = $("#inputForm input[type='hidden']")[0];
    b = $(a).parent().children();
    c.value = b.index(a);
    $(".addButton")[0].click()
  });
  a.find(".removeButton").click(function() {
    var a = $(this).parents("li"),
      b = $(a).find("h2");
    confirm('Rule "' + $(b).text() + '" will be deleted!') && (a.remove(), SaveRules())
  });
  a.appendTo("#ruleList")
}

function SaveRules() {
  var a = [];
  $.each($("#ruleList li"), function(e, b) {
    var c = $(b).find("h2"),
      d = $(b).find("td:last-child");
    a.push({
      name: $(c).text(),
      urlRE: $(d[0]).text(),
      matchRE: $(d[1]).text(),
      replaceText: $(d[2]).text(),
      disposition: $(d[3]).text()
    })
  });
  console.log("save", a);
  chrome.extension.sendMessage({
    type: "ruleschanged",
    data: a
  });
  localStorage["at.flansch.modifycontenttype.rules"] = JSON.stringify(a)
};
