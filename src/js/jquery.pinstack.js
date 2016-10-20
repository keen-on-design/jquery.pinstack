(function ($, window, document) {
  'use strict';
  
  function offsetTopRelative($target, $reference) {
    return $target.offset().top - $reference.offset().top;
  }
  
  function PinStack() {
    this.elements = [];
  }
  
  PinStack.prototype = {
    pushElement : function (item) {
      this.elements.push(item);
      return this.elements.length - 1;
    }
  };
  
  function PinBox($element, options, stack) {
    
    var defaults = {
      reference     : $("body"),
      offsetTop     : 0,
      offsetBottom  : 0,
      timeout  : false
    };
    this.isPinned    = false;
    this.dimensions  = {};
    this.bounds      = {};
    
    if (stack !== undefined) {
      this.stack = stack;
      this.stackIndex = this.stack.pushElement(this);
    }
    
    this.options = $.extend(defaults, options);
    
    this.$element = $element;
    this.$reference = this.options.reference;
    this.setDimensions();
    this.setBounds();
    this.onResize();
    this.onScroll();
  }
  
  PinBox.prototype = {
    getRelativeOffsetTop : function ($element, $reference, offset) {
      var ofs = (typeof offset !== 'undefined') ?  offset : 0;
      return $reference.offset().top - $element.offset().top + ofs;
    },
    
    setDimensions : function () {
      
      this.dimensions = {
        width  : this.$element.outerWidth(),
        height : this.$element.outerHeight()
      };
      
      this.$element.css({
        width    : this.dimensions.width,
        height   : this.dimensions.height
      });
    },
    
    setBounds : function () {
      
      var durationToAbsolute  = Math.round(this.$reference.innerHeight() / 100 * this.options.duration),
        durationMax           = this.options.durationMax,
        duration              = (durationToAbsolute < durationMax) ? durationToAbsolute : durationMax,
        boundTop              = offsetTopRelative(this.$element, this.$reference) + this.$reference.offset().top - this.options.offsetTop,
        boundBottom           = duration - this.dimensions.height - this.options.offsetBottom;
      
      if (durationMax === 0) {
        duration    = durationToAbsolute;
        boundBottom = duration - this.dimensions.height - this.options.offsetBottom;
      }
      
      this.bounds = {
        top    : boundTop,
        bottom : boundBottom
      };
    },
    
    scrollToBounds : function (scrollTop) {
      return scrollTop - this.bounds.top;
    },
    
    inBounds : function (scrollTop) {
      var top = this.scrollToBounds(scrollTop);
      return ((top >= 0) && (top <= this.bounds.bottom));
    },
    
    getProgress : function (scrollTop) {
      var top = this.scrollToBounds(scrollTop);
      //eturn top;
      if (top <= 0) {
        return 0;
      }
      
      if (top >= this.bounds.bottom) {
        return 100;
      }
      
      return {
        relative : (top / this.bounds.bottom).toFixed(2),
        absolute : top
      };
    },
    
    onResize : function () {
      var self = this;
      
      $(window).resize(function () {
        window.clearTimeout(self.options.timeout);
        self.options.timeout = window.setTimeout(function () {
          self.isPinned = false;
          self.$element.css({
            position : 'static',
            'margin-top' : 0
          });
          self.setBounds();
          self.checkPin();
        }, 1000);
      });
    },
    
    onScroll : function () {
      var self = this;
      
      $(window).scroll(function () {
        self.checkPin();
      });
    },
    
    checkPin : function () {
      var scrollTop = $(window).scrollTop();
      if (this.inBounds(scrollTop)) {
        if ($.isFunction(this.options.onProgress)) {
          this.options.onProgress.call(this);
        }
        this.pin(scrollTop);
      } else {
        this.unpin(scrollTop);
      }
    },
    
    pin : function () {
      this.isPinned = true;
      this.$element.css({
        position : 'fixed',
        top      : this.options.offsetTop + "px",
        'margin-top' : 0
      });
    },
    
    unpin : function (scrollTop) {
      this.isPinned = false;
      var position = this.scrollToBounds(scrollTop);
      this.$element.css({
        position : 'static'
      });

      if (position > 0) {
        this.$element.css({
          'margin-top' : this.bounds.bottom
        });
      } else {
        this.$element.css({
          'margin-top' : 0
        });
      }
    }
  };

  $.fn.pinstack = function (options) {
    //hack to debounce
    window.setTimeout(function () {
      $(window).trigger('resize');
    }, 1000);
    
    window.pinstack = {
      stacks : {}
    };
    
    return this.each(function () {
      var toStack = $(this).data("pinstack-tostack"),
        reference = $(this).data("pinstack-reference"),
        stack = undefined;
      
      if (reference !== undefined) {
        options.reference = $(reference);
      }
      
      if (toStack !== undefined) {
        if (window.pinstack.stacks[toStack] !== undefined) {
          stack = window.pinstack.stacks[toStack];
        } else {
          stack = new PinStack();
          window.pinstack.stacks[toStack] = stack;
        }
      }
      var pinBox = new PinBox($(this), options, stack);
    });
  };
})(jQuery, window, document);