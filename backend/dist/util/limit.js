function time() {
    return Date.now();
}
function calculateNextResetTime(windowMs, user) {
    return new Date((windowMs - (time() - user.ts)) + time());
}
function getDict() {
    return new Proxy({}, {
        get: (target, name) => name in target ? target[name] : new User()
    });
}
class User {
    hits;
    ts;
    constructor() {
        this.hits = 0;
        this.ts = Date.now();
    }
}
class MemoryStore {
    windowMs;
    hits;
    max;
    constructor(max) {
        this.max = max;
    }
    init(options) {
        this.windowMs = options.windowMs;
        this.hits = getDict();
        setInterval(() => {
            for (let k in this.hits) {
                let v = this.hits[k];
                if (v.ts + this.windowMs <= time()) {
                    delete this.hits[k];
                }
            }
        }, 60000);
    }
    increment(key) {
        let user = this.hits[key];
        let reset = calculateNextResetTime(this.windowMs, user);
        if (user.ts + this.windowMs <= time()) {
            user.hits = 0;
        }
        if (user.hits > this.max) {
            return {
                totalHits: user.hits,
                resetTime: reset
            };
        }
        user.hits++;
        user.ts = time();
        this.hits[key] = user;
        return {
            totalHits: user.hits,
            resetTime: reset
        };
    }
    decrement(key) {
        let user = this.hits[key];
        if (user.hits <= 0) {
            return;
        }
        user.hits--;
        this.hits[key] = user;
    }
    resetAll() {
        this.hits = getDict();
    }
    resetKey(key) {
        delete this.hits[key];
    }
}
export default MemoryStore;
