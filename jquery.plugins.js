/*********************************************************************************************************
*  Jquery Plugins                      ---                      Common Utils
**********************************************************************************************************
*/
(function ($) {

    if (!$.util) $.util = {};

    /**
    * $.submitForm(url|settings, data)
    */
    $.util.submitForm = function (options, data) {
        var settings = typeof options === 'string' ? { action: options } : options,
            form = $('<form method="post" />').attr(settings);

        $.each(data, function (key, value) {
            var input = $('<input type="hidden">');
            input.attr({ 'id': key, 'name': key, 'value': value });
            form.append(input);
        });

        $(document.body).append(form);
        form.submit();
    };

    /**
    * $.util.first(array, [callback(index,element)])
    * get the first element from array. 
    *
    */
    $.util.first = function (collection, predicate) {
        if (collection && collection.length == 0) {
            return null;
        }
        if (typeof predicate !== 'function') {
            return collection[0];
        }
        for (var i = 0; i < collection.length; i++) {
            var ele = collection[i];
            if (predicate.call(ele, i, ele)) {
                return ele;
            }
        }
        return null;
    };

    /**
    * $.util.deparam('?id=1&name=brian') will return  {id:1,name:'brian'}
    * parse URL query string to object, opposite function to $.param()
    */
    $.util.deparam = function(queryString) {
        if (!queryString || typeof queryString !== 'string' || queryString.indexOf('?') === -1) return null;
        queryString = queryString.split('?')[1];
        var retValue = {},
            querys = queryString.split('&'),
            pair, i;
        for (i = 0; i < querys.length; i++) {
            pair = querys[i].split('=', 2);
            if (pair.length != 2) continue;
            retValue[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1].replace(/\+/g, ' '));
        }
        return retValue;
    };

    /**
    * get some properties from other objects or extend some objects. 
    *
    * copy properties to a new object:
    *     $.util.copy(['id','name'], {id:1,name:'brian',age:28}) will return  {id:1,name:'brian'}
    * extend objects:
    *     $.util.copy({id:1,name:'brian',age:28}, {id:2}) will return  {id:2,name:'brian',age:28}
    */
    $.util.copy = function(/*[keyArray], objects...*/) {
        var keyArray = arguments[0],
            keyMode = $.isArray(keyArray) && keyArray.length > 0,
            objArray = Array.prototype.slice.call(arguments, keyMode ? 1 : 0);
        objArray.unshift({}); //insert empty object to prevent arguments being updated.
        var target = $.extend.apply(null, objArray);
        if (!keyMode) return target;
        var result = {};
        for (var key in target) {
            if (target.hasOwnProperty(key) && $.inArray(key, keyArray) > -1) {
                result[key] = target[key];
            }
        }
        return result;
    };

    $.util.alert = function (msg) {
        if (!msg) return;
        if (typeof msg !== 'string') msg = JSON.stringify(msg, null, '\t');
        msg = msg.replace(/(\\r)?(\\n)/g, '\r\n');
        if ($.isFunction(window.showMessagebox)) {
            msg = msg.replace(/\t/g, '&nbsp;&nbsp;').replace(/\r?\n/g, '<br />');
            window.showMessagebox(msg);
        } else {
            alert(msg);
        }
    };
})(jQuery);

/*********************************************************************************************************
*  Jquery Plugins                      ---                      Common fn Extensions
**********************************************************************************************************
*/
(function ($) {

    /// <summary>
    /// 	Returns the highest (top-most) zIndex in the document
    /// 	(minimum value returned: 0).
    /// </summary>	
    /// <param name="selector" type="String" optional="true">
    /// 	(optional, default = "*") jQuery selector specifying
    /// 	the elements to use for calculating the highest zIndex.
    /// </param>
    /// <returns type="Number">
    /// 	The minimum number returned is 0 (zero).
    /// </returns>
    $.topZIndex = function (selector) {
        return Math.max(0, Math.max.apply(null, $.map(((selector || "*") === "*") ? $.makeArray(document.getElementsByTagName("*")) : $(selector),
            function (v) {
                return parseFloat($(v).css("z-index")) || null;
            }
        )));
    };

    /// <summary>
    /// 	Increments the CSS z-index of each element in the matched set
    /// 	to a value larger than the highest current zIndex in the document.
    /// 	(i.e., brings all elements in the matched set to the top of the
    /// 	z-index order.)
    /// </summary>	
    /// <param name="opt" type="Object" optional="true">
    /// 	(optional) Options, with the following possible values:
    /// 	increment: (Number, default = 1) increment value added to the
    /// 		highest z-index number to bring an element to the top.
    /// 	selector: (String, default = "*") jQuery selector specifying
    /// 		the elements to use for calculating the highest zIndex.
    /// </param>
    /// <returns type="jQuery" />
    $.fn.topZIndex = function (opt) {
        // Do nothing if matched set is empty
        if (this.length === 0) {
            return this;
        }

        opt = $.extend({ increment: 1 }, opt);

        // Get the highest current z-index value
        var zmax = $.topZIndex(opt.selector),
            inc = opt.increment;

        // Increment the z-index of each element in the matched set to the next highest number
        return this.each(function () {
            this.style.zIndex = (zmax += inc);
        });
    };

    $.fn.center = function () {
        return this.each(function () {
            var $this = $(this);
            $this.css("position", "absolute");
            $this.css("top", ($(window).height() - $this.outerHeight()) / 2 + $(window).scrollTop() + "px");
            $this.css("left", ($(window).width() - $this.outerWidth()) / 2 + $(window).scrollLeft() + "px");
        });
    };

    $.fn.hoverClass = function (className) {
        return this.each(function () {
            $(this).hover(
                function () { $(this).addClass(className); },
                function () { $(this).removeClass(className); }
            );
        });
    };

    /**
    * Returns get parameters.
    *
    * If the desired param does not exist, null will be returned
    * please note URL is case insensitve. 
    *
    * To get the document params:
    * @example value = $(document).getUrlParam();
    * @example value = $(document).getUrlParam("paramName");
    * @example value = $(document).getUrlParam("paramName1","paramName2");
    * 
    * To get the params of a html-attribut (uses src attribute)
    * @example value = $('#imgLink').getUrlParam("paramName");
    */
    $.fn.getUrlParam = function(/*queryKey...*/) {

        function getValue(key, obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop) && prop.toLowerCase() === key.toLowerCase()) return obj[prop];
            }
            return null;
        }

        var curSrc = this.attr('nodeName') == '#document' ? document.location.href : (this.attr("src") || this.attr("href"));
        var queryString = $.util.deparam(curSrc);
        if (!queryString) return null;
        if (arguments.length === 0) return queryString;
        if (arguments.length === 1) return getValue(arguments[0], queryString);
        var result = {};
        for (var i = 0; i < arguments.length; i++) {
            result[arguments[i]] = getValue(arguments[i], queryString);
        }
        return result;
    };

    /**
  * Returns bool value.
  *
  * Judge current element is the child element of the target element 
  */

    $.fn.isChildAndSelfOf = function (target) {
        return (this.closest(target).length > 0);
    };

})(jQuery);

/*********************************************************************************************************
*  Jquery Plugins                      ---                      Ajax Settings & Extensions
**********************************************************************************************************
*/
(function ($) {

    $.getScript = function (url, callback, cache) {
        $.ajax({
            type: "GET",
            url: url,
            success: callback,
            dataType: "script",
            cache: cache || true
        });
    };

    $.ajax.redirect = function (jqXhr) {
        if (!jqXhr || !$.isFunction(jqXhr.getResponseHeader)) return;
        var ajaxRedirectUrl = jqXhr.getResponseHeader('AjaxRedirectUrl');
        if (ajaxRedirectUrl) window.location.href = ajaxRedirectUrl;
    };

    $.ajax.serverInernalError = function (jqXhr) {
        try {
            if (!jqXhr || !jqXhr.responseText) return;
            var data = JSON.parse(jqXhr.responseText);
            if (!data) return;
            if (data.code == '500' && data.debug) {
                $.util.alert(data);
                return;
            }
        } catch (e) {
        }
    };

    $.ajaxPrefilter(function (options, _, jqXhr) {
        if (options.ajaxRedirect) {
            jqXhr.error($.ajax.redirect);
        }
        if (options.ajaxServerInternalError) {
            jqXhr.error($.ajax.serverInernalError);
        }
    });

    //Global settings for all ajax request, could be cloesd in each ajax call
    $.ajaxSetup({ ajaxRedirect: true, ajaxServerInternalError: true });

    //Disable ajax cache for MSIE
    if ($.browser.msie) $.ajaxSetup({ cache: false });
})(jQuery);
