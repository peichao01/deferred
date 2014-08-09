KISSY.add('mybrand/base/deferred', function (S, inherit) {

	var id = 0;

	function wait (ms) {
		return function __wait__() {
			var d = new Deferred();
			d.timeoutid = setTimeout(function () {
				delete d.timeoutid;
				d.resolve();
			}, ms);
			return d;
		}
	}

	function isDeferredStoped (deferred) {
		while(deferred instanceof Deferred){
			if(deferred.isStoped) return true;
			deferred = deferred.parent;
		}
	}

	var Deferred = inherit({
		name: 'Deferred',
		proto: {
			__constructor: function() {
				this.id = id++;
				this.successes = [];
				this.fails = [];
			},
			resolve: function () {
				var args = S.makeArray(arguments);
				var suc, r;
				for(var i = 0, len = this.successes.length; i < len; i++){
					suc = this.successes[i];
					r = !isDeferredStoped(this) && S.isFunction(suc) && suc.apply(this, args);
					if(r instanceof Deferred) {
						// 将回调函数转移过去
						r.successes = this.successes.splice(i+1);
						r.fails = this.fails.splice(i+1);

						this.child = r;
						r.parent = this;
						break;
					}
				}
				return this;
			},
			reject: function () {
				var args = S.makeArray(arguments);
				var f, r, i = 0, len = this.fails.length;
				for(; i < len; i++){
					f = this.fails[i];
					if(S.isFunction(f)) break;
				}
				f && f.apply(this, args);
				return this;
			},
			then: function (success, fail) {
				this.successes.push(success);
				this.fails.push(fail);
				return this;
			},
			wait: function (ms) {
				return this.then(wait(ms));
			},
			// 停止往下传播
			stop: function () {
				var d = this;
				while(d instanceof Deferred){
					d.timeoutid && clearTimeout(d.timeoutid);
					d.isStoped = true;

					d = d.child;
				}
				return this;
			},
			resume: function () {},
			success: function (fn) {
				return this.then(fn);
			},
			fail: function (fn) {
				return this.then(null, fn);
			}
		},
		statics: {
			deferred: function () {
				return new Deferred();
			}
		}
	});

	return Deferred;

}, {
	requires: ['mybrand/base/inherit']
});