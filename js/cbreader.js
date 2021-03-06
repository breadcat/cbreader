var viewer = false;
var viewerOpts = {
  nav: 'thumbs',
  allowfullscreen: 'native',
  loop: false,
  maxheight: '90%',
  transition: 'crossfade',
  clicktransition: 'crossfade',
  keyboard: {
    'home': true,
    'end': true,
    'up': true,
    'down': true
  }
}
var popoverOpts = {
  placement: 'bottom',
  content: '<a tabindex="0" class="btn btn-primary btnSelectCover" role="button">Select Cover</a>',
  html: true
}
$.fn.spin.presets.spinLarge = {
  lines: 13,
  length: 20,
  width: 10,
  radius: 20,
  hwaccel: true
}
$.fn.spin.presets.spinSmall = {
  lines: 10,
  length: 6,
  width: 4,
  radius: 9,
  hwaccel: true
}

var lastPosition = null;

$(document).ready(function() {

  getComics();
  if(window.location.hash) {
    if(window.location.hash.substring(1, 5) != 'row_') {
      $("#comics").hide();
      getIssues(decodeURIComponent(window.location.hash.substring(1)));
    }
  }

  $('.navbar-brand').on('click', function() {
    goHome();
  });

});

function getComics() {
  $("#comics").spin('spinLarge', '#000');
  $.getJSON('api.php?get=comics', function(data) {
    $("#comics").spin(false);
    var prevChar, curRow, curComics;
    var rowIdx = 0;
    $.each(data.comics, function(i, comic) {
      var curChar = comic.charAt(0);
      if(curChar !== prevChar) {
        curRow = $('<div  id="row_'+curChar+'" class="row rowChar row_'+((rowIdx%2)?'odd':'even')+'"/>');
        var title = $('<div class="col-md-1 rowHeader text-center"><button class="btn btn-block btn-sm btnUp"><span class="oi oi-chevron-top"></span></button><span class="curChar">'+curChar+'</span></div>');
        curComics = $('<div class="col-md-11 rowComics"></div>');
        curRow.append(title).append(curComics);
        $('#comics').append(curRow);
        var navChar = $('<li class="nav-item"><a class="nav-link" href="#row_'+curChar+'">'+curChar+'</a></li>');
        navChar.on('click', function() {
          $('html, body').animate({
            scrollTop: $('#row_'+curChar).offset().top - 55
          }, 'fast');
        });
        $('#navChar').append(navChar);
        rowIdx++;
      }
      prevChar = curChar;
      var comicCard = $('<div class="card shadow text-center" data-comic="'+comic+'">' +
          '<img class="card-img-top lazyload" src="data:image/gif;base64,R0lGODdhAQABAPAAAMPDwwAAACwAAAAAAQABAAACAkQBADs=" data-src="api.php?get=cover&comic='+encodeURIComponent(comic)+'" alt="'+comic+'">' +
          '<div class="card-body">' +
            '<p class="card-text" data-toggle="tooltip" data-placement="top" title="'+comic+'">'+comic+'</p>' +
          '</div>' +
        '</div>');
      comicCard.on('click', function() {
        lastPosition = $(window).scrollTop();
        getIssues(comic);
      });
      $(curComics).append(comicCard);
    });
    $("#comics").find("img.lazyload").lazyload();
    $('[data-toggle="tooltip"]').tooltip();
    $('.btnUp').on('click', function() {
      $('html, body').animate({
        scrollTop: 0
      }, 'fast');
    });
  });
}

function getIssues(comic) {
  var cardComic = $('.card[data-comic="'+comic+'"]');
  $(cardComic).spin('spinSmall', '#fff');
  $.getJSON('api.php?get=issues&comic='+encodeURIComponent(comic), function(data) {
    $(cardComic).spin(false);
    window.location.hash = comic;
    var issues = $('#issues');
    var title = $('<div class="row rowHeader alert alert-dark"><button class="btn btn-light btn-sm btnHome"><span class="oi oi-chevron-left"></span></button>'+comic+'</div>');
    var issuesList = $('<div class="row rowComics"></div>');
    $.each(data.issues, function(i, issue) {
      var issueCard = $('<div class="card shadow text-center" data-comic="'+comic+'" data-issue="'+issue+'">' +
          '<img class="card-img-top lazyload" src="data:image/gif;base64,R0lGODdhAQABAPAAAMPDwwAAACwAAAAAAQABAAACAkQBADs=" data-src="api.php?get=cover&comic='+encodeURIComponent(comic)+'&issue='+encodeURIComponent(issue)+'" alt="'+issue+'">' +
          '<div class="card-body">' +
            '<p class="card-text" data-toggle="tooltip" data-placement="top" title="'+issue+'">'+(issue.substr(0, issue.lastIndexOf('.')) || issue)+'</p>' +
          '</div>' +
        '</div>');
      var issueOptions = $('<a class="issueOptions" tabindex="0" role="button" data-toggle="popover" title="Options"><span class="oi oi-cog" title="Options" aria-hidden="true"></span></a>');
      issueCard.hover(function() {
        issueOptions.stop().fadeIn('slow');
      }, function() {
        issueOptions.stop().fadeOut('slow');
      });
      issueCard.append(issueOptions);
      issuesList.append(issueCard);
      issueCard.find('img').on('click', function() {
        showIssue(comic, issue);
      });
    });
    issues.append(title).append(issuesList);
    $('#navChar').fadeOut('slow');
    $('#comics').fadeOut('slow', function() {
      $('html, body').scrollTop($('#wrapper').offset().top - 72);
      issues.fadeIn('slow', function() {
        $("#wrapper img.lazyload").lazyload();
      });
    });
    $('.btnHome').on('click', function() {
      goHome();
    });
    $('[data-toggle="tooltip"]').tooltip();
    $('[data-toggle="popover"]').popover(popoverOpts).on('shown.bs.popover', function () {
      var comic = $(this).parent().data('comic');
      var issue = $(this).parent().data('issue');
      var trigger = $(this);
      $('a.btnSelectCover').on('click', function() {
        getCovers(comic, issue, $(this).parent(), trigger, false);
      });
    });
  });
}

function showIssue(comic, issue) {
  $.getJSON('api.php?get=pages&issue='+encodeURIComponent(issue)+'&comic='+encodeURIComponent(comic), function(data) {
    viewerData = new Array();
    $.each(data.pages, function (i, page) {
      viewerData.push({
        img: 'api.php?page='+encodeURIComponent(page)+'&issue='+encodeURIComponent(issue)+'&comic='+encodeURIComponent(comic), 
        caption: (i+1)+'/'+data.pages.length
      });
    });
    $('#modalViewer').modal('show');
  });
}

function getCovers(comic, issue, container, trigger, loadAll) {
  $.getJSON('api.php?get=pages&issue='+encodeURIComponent(issue)+'&comic='+encodeURIComponent(comic)+((loadAll == true)?'':'&cover=true'), function(data) {
    var covers = $('<div />');
    $.each(data.pages, function(i, page) {
      covers.append('<img class="selectCover lazyload" data-page="'+page+'" src="data:image/gif;base64,R0lGODdhAQABAPAAAMPDwwAAACwAAAAAAQABAAACAkQBADs=" data-src="api.php?page='+encodeURIComponent(page)+'&issue='+encodeURIComponent(issue)+'&comic='+encodeURIComponent(comic)+'&cover=true"/>');
    });
    covers.find("img.lazyload").lazyload();
    var loadAll = $('<div class="loadAllCovers"><a tabindex="0" role="button"><span class="oi oi-reload"></span></a></div>');
    loadAll.on('click', function() {
      getCovers(comic, issue, container, trigger, true);
    });
    $(container).empty().append(covers).append(loadAll);
    $('.selectCover').on('click', function() {
      var page = $(this).data('page');
      $.getJSON('api.php?set=cover&page='+encodeURIComponent(page)+'&issue='+encodeURIComponent(issue)+'&comic='+encodeURIComponent(comic), function(data) {
        if(data.success == true) {
          $(trigger).popover('hide');
          $('div.card[data-issue="'+issue+'"] img').attr('src', 'api.php?get=cover&comic='+encodeURIComponent(comic)+'&issue='+encodeURIComponent(issue)+'&'+ new Date().getTime());
        }
      });
    });
  });
}

$('#modalViewer').on('shown.bs.modal', function (e) {
  if (viewer == false) {
    var viewerDiv = $('#viewer').fotorama(viewerOpts);
    viewer = viewerDiv.data('fotorama');
  }
  viewer.load(viewerData);
  viewer.show(0);
});

$('#modalViewer').on('hidden.bs.modal', function (e) {
  viewer.destroy();
  viewer = false;
  $(this).removeData();
});

function goHome() {
  $('[data-toggle="popover"]').popover('hide');
  $('#navChar').fadeIn('slow');
  $('#issues').fadeOut('slow', function() {
    window.location.hash = '';
    $('#issues').empty();
    $('#comics').fadeIn('slow');
    $('html, body').animate({
      scrollTop: lastPosition
    }, 'fast');
  });
}