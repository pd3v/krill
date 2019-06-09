const math = require("mathjs");
const _ = require("lodash");

require("../sequence.js");

////////////////////////////////////////////////////////////////////////////////

Step = function(time, values)
{
  this.time_ = (typeof time == 'string') ? math.fraction(time) : time;
  this.values_ = values;
}

Step.prototype.time = function()
{
  return this.time_;
}

Step.prototype.applyTime = function(f)
{
  return new Step(f(this.time_),this.values_);
}

Step.prototype.timeString = function()
{
    return math.format(this.time_);
}

Step.prototype.values = function()
{
  return this.values_;
}

////////////////////////////////////////////////////////////////////////////////

// Apply a scaling factor on the element array so all elements
// fit a 1 cycles length all together
function ScaleAndOffset(stepArray)
{
  var scaleFactor = math.fraction("1/"+stepArray.length);
  var offset = math.fraction(0);
  // every step is an array that need to be scaled
  // we also drop any element that is a rest (~)
  return scaled = stepArray.map((s) => {
    result = s.reduce((c,x) => {
      if (x.values_ != "~")
      {
        const offsetted = x.applyTime((t) => { return math.add(math.multiply(t,scaleFactor), offset)});
        c.push(offsetted);
      }
      return c;
    },[]);
    offset = math.add(offset,scaleFactor);
    return result;
  })
}

var SequenceRenderingOperator = function(operatorArray, alignment)
{
  this.nodes_ = operatorArray;
  this.alignment_ = alignment;
}

SequenceRenderingOperator.prototype.tick = function()
{
  this.current_ = (this.current_ + 1) % this.nodes_.length;
  this.nodes_.forEach((x) => x.tick());
}

SequenceRenderingOperator.prototype.render = function()
{
  // Renders concatenate sub steps as full cycles
  const steps = this.nodes_.map((x) => x.render().sequence_);

  // In horizontal mode, all steps are dividing the interval so we scale them accordingly
  const scaled = (this.alignment_ == "h") ? ScaleAndOffset(steps)  : steps;

  // Merge all data in a single array
  const merged = scaled.reduce(function(collection,x) {
     return collection.concat(x);
  }, []);

  // Collect all result in a single, sorted array
  var grouped = merged.reduce(function(collection, x) {
    // push and create if necessary
    var t = x.timeString();
    (collection[t] = collection[t] ? collection[t]: []).push(x.values_);
     return collection;}
  ,{});

  const ordered = [];
  const fractionCompareFn = (a,b) => { return math.compare(math.fraction(a), math.fraction(b))};
  Object.keys(grouped).sort(fractionCompareFn).forEach(function(key) {
    ordered.push(new Step(key,_.flattenDeep(grouped[key])));
  });

//  console.log('returning ' + JSON.stringify(ordered));
  return new Sequence(ordered);
}

//////////////////////////////////////////////////////////////////////////////

makeSequenceRenderingOperator = function(childArray, alignment)
{
  if (!Array.isArray(childArray)) throw ("Unexpected child data type");
  return new SequenceRenderingOperator(childArray, alignment);
}
