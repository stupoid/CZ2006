'use strict';

angular.module('mgcrea.ngStrap.typeahead', ['mgcrea.ngStrap.tooltip', 'mgcrea.ngStrap.helpers.parseOptions'])

  .provider('$typeahead', function() {

    var defaults = this.defaults = {
      animation: 'am-fade',
      prefixClass: 'typeahead',
      prefixEvent: '$typeahead',
      placement: 'bottom-left',
      templateUrl: 'typeahead/typeahead.tpl.html',
      trigger: 'focus',
      container: false,
      keyboard: true,
      html: false,
      delay: 0,
      minLength: 1,
      filter: 'bsAsyncFilter',
      limit: 6,
      autoSelect: false,
      comparator: '',
      trimValue: true
    };

    this.$get = function($window, $rootScope, $tooltip, $$rAF, $timeout) {

      var bodyEl = angular.element($window.document.body);

      function TypeaheadFactory(element, controller, config) {

        var $typeahead = {};

        // Common vars
        var options = angular.extend({}, defaults, config);

        $typeahead = $tooltip(element, options);
        var parentScope = config.scope;
        var scope = $typeahead.$scope;

        scope.$resetMatches = function() {
          scope.$matches = [];
          scope.$activeIndex = options.autoSelect ? 0 : -1; // If set to 0, the first match will be highlighted
        };
        scope.$resetMatches();

        scope.$activate = function(index) {
          scope.$$postDigest(function() {
            $typeahead.activate(index);
          });
        };

        scope.$select = function(index, evt) {
          scope.$$postDigest(function() {
            $typeahead.select(index);
          });
        };

        scope.$isVisible = function() {
          return $typeahead.$isVisible();
        };

        // Public methods

        $typeahead.update = function(matches) {
          scope.$matches = matches;
          if (scope.$activeIndex >= matches.length) {
            scope.$activeIndex = options.autoSelect ? 0 : -1;
          }

          // wrap in a $timeout so the results are updated
          // before repositioning
          safeDigest(scope);
          $$rAF($typeahead.$applyPlacement);
        };

        $typeahead.activate = function(index) {
          scope.$activeIndex = index;
        };

        $typeahead.select = function(index) {
          if (index === -1) return;
          var value = scope.$matches[index].value;
          // console.log('$setViewValue', value);
          controller.$setViewValue(value);
          controller.$render();
          scope.$resetMatches();
          if (parentScope) parentScope.$digest();
          // Emit event
          scope.$emit(options.prefixEvent + '.select', value, index, $typeahead);
        };

        // Protected methods

        $typeahead.$isVisible = function() {
          if (!options.minLength || !controller) {
            return !!scope.$matches.length;
          }
          // minLength support
          return scope.$matches.length && angular.isString(controller.$viewValue) && controller.$viewValue.length >= options.minLength;
        };

        $typeahead.$getIndex = function(value) {
          var l = scope.$matches.length,
            i = l;
          if (!l) return;
          for (i = l; i--;) {
            if (scope.$matches[i].value === value) break;
          }
          if (i < 0) return;
          return i;
        };

        $typeahead.$onMouseDown = function(evt) {
          // Prevent blur on mousedown
          evt.preventDefault();
          evt.stopPropagation();
        };

        $typeahead.$onKeyDown = function(evt) {
          if (!/(38|40|13)/.test(evt.keyCode)) return;

          // Let ngSubmit pass if the typeahead tip is hidden or no option is selected
          if ($typeahead.$isVisible() && !(evt.keyCode === 13 && scope.$activeIndex === -1)) {
            evt.preventDefault();
            evt.stopPropagation();
          }

          // Select with enter
          if (evt.keyCode === 13 && scope.$matches.length) {
            $typeahead.select(scope.$activeIndex);
          }

          // Navigate with keyboard
          else if (evt.keyCode === 38 && scope.$activeIndex > 0) scope.$activeIndex--;
          else if (evt.keyCode === 40 && scope.$activeIndex < scope.$matches.length - 1) scope.$activeIndex++;
          else if (angular.isUndefined(scope.$activeIndex)) scope.$activeIndex = 0;
          scope.$digest();
        };

        // Overrides

        var show = $typeahead.show;
        $typeahead.show = function() {
          show();
          // use timeout to hookup the events to prevent
          // event bubbling from being processed immediately.
          $timeout(function() {
            $typeahead.$element && $typeahead.$element.on('mousedown', $typeahead.$onMouseDown);
            if (options.keyboard) {
              element && element.on('keydown', $typeahead.$onKeyDown);
            }
          }, 0, false);
        };

        var hide = $typeahead.hide;
        $typeahead.hide = function() {
          $typeahead.$element && $typeahead.$element.off('mousedown', $typeahead.$onMouseDown);
          if (options.keyboard) {
            element && element.off('keydown', $typeahead.$onKeyDown);
          }
          if (!options.autoSelect)
            $typeahead.activate(-1);
          hide();
        };

        return $typeahead;

      }

      // Helper functions

      function safeDigest(scope) {
        scope.$$phase || (scope.$root && scope.$root.$$phase) || scope.$digest();
      }

      TypeaheadFactory.defaults = defaults;
      return TypeaheadFactory;

    };

  })

  .filter('bsAsyncFilter', function($filter) {
    return function(array, expression, comparator) {
      if (array && angular.isFunction(array.then)) {
        return array.then(function(results) {
          return $filter('filter')(results, expression, comparator);
        });
      } else {
        return $filter('filter')(array, expression, comparator);
      }
    };
  })

  .directive('bsTypeahead', function($window, $parse, $q, $typeahead, $parseOptions) {

    var defaults = $typeahead.defaults;

    return {
      restrict: 'EAC',
      require: 'ngModel',
      link: function postLink(scope, element, attr, controller) {

        // Directive options
        var options = {
          scope: scope
        };
        angular.forEach(['template', 'templateUrl', 'controller', 'controllerAs', 'placement', 'container', 'delay', 'trigger', 'keyboard', 'html', 'animation', 'filter', 'limit', 'minLength', 'watchOptions', 'selectMode', 'autoSelect', 'comparator', 'id', 'prefixEvent', 'prefixClass'], function(key) {
          if (angular.isDefined(attr[key])) options[key] = attr[key];
        });

        // use string regex match boolean attr falsy values, leave truthy values be
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach(['html', 'container', 'trimValue'], function(key) {
          if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key])) options[key] = false;
        });

        // Disable browser autocompletion
        if (!element.attr('autocomplete')) element.attr('autocomplete', 'off');

        // Build proper bsOptions
        var filter = options.filter || defaults.filter;
        var limit = options.limit || defaults.limit;
        var comparator = options.comparator || defaults.comparator;

        var bsOptions = attr.bsOptions;
        if (filter) bsOptions += ' | ' + filter + ':$viewValue';
        if (comparator) bsOptions += ':' + comparator;
        if (limit) bsOptions += ' | limitTo:' + limit;
        var parsedOptions = $parseOptions(bsOptions);

        // Initialize typeahead
        var typeahead = $typeahead(element, controller, options);

        // Watch options on demand
        if (options.watchOptions) {
          // Watch bsOptions values before filtering for changes, drop function calls
          var watchedOptions = parsedOptions.$match[7].replace(/\|.+/, '').replace(/\(.*\)/g, '').trim();
          scope.$watchCollection(watchedOptions, function(newValue, oldValue) {
            // console.warn('scope.$watch(%s)', watchedOptions, newValue, oldValue);
            parsedOptions.valuesFn(scope, controller).then(function(values) {
              typeahead.update(values);
              controller.$render();
            });
          });
        }

        // Watch model for changes
        scope.$watch(attr.ngModel, function(newValue, oldValue) {
          // console.warn('$watch', element.attr('ng-model'), newValue);
          scope.$modelValue = newValue; // Publish modelValue on scope for custom templates
          parsedOptions.valuesFn(scope, controller)
            .then(function(values) {
              // Prevent input with no future prospect if selectMode is truthy
              // @TODO test selectMode
              if (options.selectMode && !values.length && newValue.length > 0) {
                controller.$setViewValue(controller.$viewValue.substring(0, controller.$viewValue.length - 1));
                return;
              }
              if (values.length > limit) values = values.slice(0, limit);
              var isVisible = typeahead.$isVisible();
              isVisible && typeahead.update(values);
              // Do not re-queue an update if a correct value has been selected
              if (values.length === 1 && values[0].value === newValue) return;
              !isVisible && typeahead.update(values);
              // Queue a new rendering that will leverage collection loading
              controller.$render();
            });
        });

        // modelValue -> $formatters -> viewValue
        controller.$formatters.push(function(modelValue) {
          // console.warn('$formatter("%s"): modelValue=%o (%o)', element.attr('ng-model'), modelValue, typeof modelValue);
          var displayValue = parsedOptions.displayValue(modelValue);

          // If we can determine the displayValue, use that
          if (displayValue) {
            return displayValue;
          }

          // If there's no display value, attempt to use the modelValue.
          // If the model is an object not much we can do
          if (modelValue && typeof modelValue !== 'object') {
            return modelValue;
          }
          return '';
        });

        // Model rendering in view
        controller.$render = function() {
          // console.warn('$render', element.attr('ng-model'), 'controller.$modelValue', typeof controller.$modelValue, controller.$modelValue, 'controller.$viewValue', typeof controller.$viewValue, controller.$viewValue);
          if (controller.$isEmpty(controller.$viewValue)) {
            return element.val('');
          }
          var index = typeahead.$getIndex(controller.$modelValue);
          var selected = angular.isDefined(index) ? typeahead.$scope.$matches[index].label : controller.$viewValue;
          selected = angular.isObject(selected) ? parsedOptions.displayValue(selected) : selected;
          var value = selected ? selected.toString().replace(/<(?:.|\n)*?>/gm, '') : '';
          element.val(options.trimValue === false ? value : value.trim());
        };

        // Garbage collection
        scope.$on('$destroy', function() {
          if (typeahead) typeahead.destroy();
          options = null;
          typeahead = null;
        });

      }
    };

  });
