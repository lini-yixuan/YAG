; (function ($, window, document, undefined) {
 var pluginName = 'yagUpload',
  defaults = {
   serviceUrl: '',
   moduleId: '-1',
   tabId: '-1',
   localization: {
    deleteConfirm : 'Do you really want to delete this picture?',
    uploaded: 'Uploaded',
    queued: 'Queued',
    cmdDelete: 'Delete'
    }
  };

 function yagUpload(element, options) {
  this.element = element;
  this.options = $.extend({}, defaults, options);
  this._defaults = defaults;
  this._name = pluginName;
  this.init();

  $(this.element).fileupload({
   fileTypes: /^image\/(gif|jpeg|png)$/,
   maxFileSize: 2000000,
   maxChunkSize: 1000000,
   progressall: function (e, data) {
    var progress = parseInt(data.loaded / data.total * 100, 10);
    $('#progress .bar').css(
            'width',
            progress + '%'
        );
   },
   done: function (e, data) {
    data.context.find('div.status').text(options.localization.uploaded);
    data.context.find('div.commands button').addClass('btn-danger delete').removeAttr('disabled').click(function (e) {
     if (confirm(options.localization.deleteConfirm)) {
      if ($.post(options.serviceUrl+'Delete?TabId='+options.tabId+'&ModuleId='+options.moduleId,
        { fileName: data.files[0].name })) {$(data.context).remove();};
     };
    });
    $.post(options.serviceUrl+'Commit?TabId='+options.tabId+'&ModuleId='+options.moduleId,
        { fileName: data.files[0].name },
        function(res) {
         data.context.find('div.thumbnailcolumn img').attr('src', res);
        });
    data.context.find('div.progresscolumn div.progress div.bar').css('width', '0%');
   },
   progress: function (e, data) {
    var progress = _formatPercentage(data.loaded / data.total);
    data.context.find('div.status').text(_renderExtendedProgress(data));
    data.context.find('div.progresscolumn div.progress div.bar').css('width', progress);
   },
   add: function (e, data) {
    data.context = $('<div class="row-fluid" />').appendTo('div.files');
    $('<div class="span3 textcell title" />').text(data.files[0].name).appendTo(data.context);
    $('<div class="span2 textcell status" />').text(options.localization.queued).appendTo(data.context);
    $('<div class="span2 textcell progresscolumn" />').append($('<div class="progress progress-striped progress-info" />').append($('<div class="bar" style="width:0%" />'))).appendTo(data.context);
    $('<div class="span2 thumbnailcolumn" />').append($('<img/>')).appendTo(data.context);
    $('<div class="span2 textcell commands" />').append($('<button class="btn"/>', { type: 'button', disabled: 'disabled', id: 'delete'+data.files[0].name }).append($('<i class="icon-trash icon-white"/>'))).appendTo(data.context).find('button:first-child').append($('<span/>').text(options.localization.cmdDelete));
    _upload(data, 4)
    $('button.cancel').click(function (e) {
     jqXHR.abort();
    });
  },
   start: function (e) {
   },
   failed: function (e) {
   },
   send: function (e, data) {
    var that = $(this).data('fileupload');
    if (data.context && data.dataType &&
                        data.dataType.substr(0, 6) === 'iframe') {
     data.context.find('div.progresscolumn div.progress div.bar').css('width', '100%');
    }
    return that._trigger('sent', e, data);
   }
  });
 }

  _upload = function (data, retries) {
   if (retries > 0) {
     var jqXHR = data.submit()
      .error(function (jqXHR, textStatus, errorThrown) {
        data.context.find('div.status').addClass('error').text(textStatus);
        $.post(options.serviceUrl+'Delete?TabId='+options.tabId+'&ModuleId='+options.moduleId,
         { fileName: data.files[0].name });
        setTimeout(function() {_upload(data, retries-1)}, 1000);    
       })
   }
  }

  _formatFileSize = function (bytes) {
   if (typeof bytes !== 'number') {
    return '';
   }
   if (bytes >= 1000000000) {
    return (bytes / 1000000000).toFixed(2) + ' GB';
   }
   if (bytes >= 1000000) {
    return (bytes / 1000000).toFixed(2) + ' MB';
   }
   return (bytes / 1000).toFixed(2) + ' KB';
  }

  _formatBitrate = function (bits) {
   if (typeof bits !== 'number') {
    return '';
   }
   if (bits >= 1000000000) {
    return (bits / 1000000000).toFixed(2) + ' Gbit/s';
   }
   if (bits >= 1000000) {
    return (bits / 1000000).toFixed(2) + ' Mbit/s';
   }
   if (bits >= 1000) {
    return (bits / 1000).toFixed(2) + ' kbit/s';
   }
   return bits + ' bit/s';
  }

  _formatTime = function (seconds) {
   var date = new Date(seconds * 1000),
                days = parseInt(seconds / 86400, 10);
   days = days ? days + 'd ' : '';
   return days +
                ('0' + date.getUTCHours()).slice(-2) + ':' +
                ('0' + date.getUTCMinutes()).slice(-2) + ':' +
                ('0' + date.getUTCSeconds()).slice(-2);
  }

  _formatPercentage = function (floatValue) {
   return (floatValue * 100).toFixed(2) + '%';
  }

  _renderExtendedProgress = function (data) {
   return this._formatBitrate(data.bitrate) + ' | ' +
                this._formatTime(
                    (data.total - data.loaded) * 8 / data.bitrate
                ) + ' | ' +
                this._formatPercentage(
                    data.loaded / data.total
                ) + ' | ' +
                this._formatFileSize(data.loaded) + ' / ' +
                this._formatFileSize(data.total);
  }

 yagUpload.prototype.init = function () {
 };

 $.fn[pluginName] = function (options) {
  return this.each(function () {
   if (!$.data(this, 'plugin_' + pluginName)) {
    $.data(this, 'plugin_' + pluginName,
                new yagUpload(this, options));
   }
  });
 }

})(jQuery, window, document);


