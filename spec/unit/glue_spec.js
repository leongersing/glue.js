var vows = require('vows')
,   util = require('util')
,   assert = require('assert')

,   suite = vows.describe('Glue private functions')
,   Glue = require("../../lib/glue");

suite.addBatch({
  "set": {
    topic: new Glue({level1: ''}),

    "simple assignment": function(topic) {
      topic.set('level1', 'top level');
      assert.equal(topic.getBoundObject().level1, "top level");
    },

    "nested assignment": function() {
      var topic = new Glue({level1: {level2: ''}});

      topic.set('level1.level2', 'two levels');
      assert.equal(topic.getBoundObject().level1.level2, "two levels");
    },

    "deeply nested assignment": function() {
      var topic = new Glue({level1: {level2: {level3: ''}}});

      topic.set('level1.level2.level3', 'three levels');
      assert.equal(topic.getBoundObject().level1.level2.level3, "three levels");
    },

    "invocation returns itself for chainability": function(topic) {
      var returnedValue = topic.set('level1', 'top level');
      assert.equal(topic, returnedValue);
    }
  },
});

suite.addBatch({
  "get": {

    "a property": function(topic) {
      var topic = new Glue({foo: 'bar'});

      assert.equal(topic.get("foo"), "bar");
    },

    "a nested property": function(topic) {
      var topic = new Glue({foo: {bar: 'baz'}});

      assert.equal(topic.get("foo.bar"), "baz");
    },

    "a deeply property": function(topic) {
      var topic = new Glue({foo: {bar: {baz: 'zap'}}});

      assert.equal(topic.get("foo.bar.baz"), "zap");
    }
  }
});

suite.addBatch({
  // Developers should only set keyPaths to functions whose invocation
  // has no side effects.
  //
  // ex. count()
  //
  // If you set a keypath to somethingThatWillChangeTheObjectsState()
  // getting "somethingThatWillChangeTheObjectsState()" can change other
  // attributes in the objects which will go on unreported to other listeners

  "get with functional keypath": {

    "a functional property": function(topic) {
      var topic = new Glue({
        foo: function() {
          return 3;
        }
      });

      assert.equal(topic.get("foo()"), 3);
    },

    "a nested calculated property": function(topic) {
      var topic = new Glue({
        foo: {
          bar: function() {
            return 3;
          }
        }
      });

      assert.equal(topic.get("foo.bar()"), 3);
    },

    "a chained calculated property": function(topic) {
      var topic = new Glue({
        foo: function() {
          return { bar: 3 };
        }
      });

      assert.equal(topic.get("foo().bar"), 3);
    },

    "a complex chained calculated property": function(topic) {
      var topic = new Glue({
        foo: {
          bar: function() {
            return { baz: 3 };
          }
        }
      });

      assert.equal(topic.get("foo.bar().baz"), 3);
    }
  }
});

suite.addBatch({
  // The use of "(" and ")" to get calculated attribute is there for the convinience of
  // the developer, but it is indeed equivalent a normal keypath.
  //
  // For example getting keypath "foo" is equivalent to getting "(foo)", or "foo.(bar)"
  // and "(foo).bar" and so forth

  "get with calculated keypath": {

    "a functional property": function(topic) {
      var topic = new Glue({
        foo: (function() {
          return 3;
        })()
      });

      assert.equal(topic.get("(foo)"), 3);
    },

    "a nested calculated property": function(topic) {
      var topic = new Glue({
        foo: {
          bar: (function() {
            return 3;
          })()
        }
      });

      assert.equal(topic.get("foo.(bar)"), 3);
    },

    "a nested calculated property": function(topic) {
      var topic = new Glue({
        foo: {
          bar: (function() {
            return { baz: 3 };
          })()
        }
      });

      assert.equal(topic.get("foo.(bar).baz"), 3);
    },

    "a chained calculated property": function(topic) {
      var topic = new Glue({
        foo: (function() {
          return { bar: 3 };
        })()
      });

      assert.equal(topic.get("(foo).bar"), 3);
    }
  }
});

suite.addBatch({
  "getBoundObject": {
    topic: new Glue({foo: 1}),

    "returns a copy of the bound object": function(topic) {
      assert.deepEqual(topic.getBoundObject(), {foo: 1});
    },

    "manipulating object returned should not returned the actual bound object": function(topic) {
      var boundObject = topic.getBoundObject();

      boundObject.foo = 2;
      assert.deepEqual(topic.boundObject, {foo: 1});
      assert.notDeepEqual(topic.boundObject, {foo: 2});
    }
  }
});

suite.addBatch({
  "addObserver": {
    topic: new Glue({foo: "bar", baz: "zap"}),

    "can be assigned to an anonymous function": function(topic) {
      var listenerHollaBackWasInvoked = false;

      topic.addObserver(function() {
        listenerHollaBackWasInvoked = true;
      });

      topic.set("foo", "baz");
      assert.equal(listenerHollaBackWasInvoked, true);
    },

    "can be assigned to an object": function(topic) {
      var listenerHollaBackWasInvoked = false;

      topic.addObserver({an: 'object'}, function() {
        listenerHollaBackWasInvoked = true;
      });

      topic.set("baz", "baz");
      assert.equal(listenerHollaBackWasInvoked, true);
    },

    "can be assigned to an anonymous function with a keypath": function(topic) {
      var listenerHollaBackWasInvoked = false;

      topic.addObserver(function() {
        listenerHollaBackWasInvoked = true;
      }, 'foo');

      topic.set("baz", "baz");
      assert.equal(listenerHollaBackWasInvoked, false);

      topic.set("foo", "baz");
      assert.equal(listenerHollaBackWasInvoked, true);
    },

    "can be assigned to an object with a keypath": function(topic) {
      var listenerHollaBackWasInvoked = false;

      topic.addObserver({an: 'object'}, 'foo', function() {
        listenerHollaBackWasInvoked = true;
      });

      topic.set("baz", "baz");
      assert.equal(listenerHollaBackWasInvoked, false);

      topic.set("foo", "baz");
      assert.equal(listenerHollaBackWasInvoked, true);
    },

    "when invoked, returns itself for chainability": function(topic) {
      var returnedValue = topic.addObserver(1, function(){});
      assert.equal(topic, returnedValue);
    }
  }
});

suite.addBatch({
  "addObserver complex behavior": {
    topic: new Glue({
      internalArray: [],

      bar: function() {
        return this.internalArray.length;
      }
    }),

    "can specify that a keypath is calculated": function(topic) {
      var listenerHollaBackWasInvoked = false;
      topic.set('internalArray', []);

      topic.addObserver({an: 'object'}, 'internalArray.(length)', function() {
        listenerHollaBackWasInvoked = true;
      });

      topic.set('internalArray', []);
      assert.equal(listenerHollaBackWasInvoked, false);

      topic.set('internalArray', [3]);
      assert.equal(listenerHollaBackWasInvoked, true);
    },

    "can specify that a keypath is a function": function(topic) {
      var listenerHollaBackWasInvoked = false;
      topic.set('internalArray', []);

      topic.addObserver({an: 'object'}, 'bar()', function() {
        listenerHollaBackWasInvoked = true;
      });

      topic.set('internalArray', []);
      assert.equal(listenerHollaBackWasInvoked, false);

      topic.set('internalArray', [3]);
      assert.equal(listenerHollaBackWasInvoked, true);
    }
  }
});

suite.export(module);
