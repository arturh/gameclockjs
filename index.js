//#gameclock

//This proof of concept aims to provide a self-contained application in
//one html file. Constraints are:
//
// * One file
//
// * Cacheable by caching browsers, ie under 25K.
//     (See: http://www.yuiblog.com/blog/2008/02/06/iphone-cacheability/)
//
// * Targeting webkit based native mobile browsers, ie iOS's and Android (2.2, 2.1)
//
// * Other browsers optionally supported only via HTML5 (no custom extensions)
//
// * Must be enjoyable to read and easy to understand.
//
// * Easy to understand
//
// * Interesting techniques will be linked to explanations, for further learning
//   and great goodness
//
// * Not using libraries to abstract us from the Javascript / DOM. Let's see how far
//   we can go with what's there already
//
// * Don't be too clever (believe me, I'm restraining myself)



// Directives for JSLint, Javascript checker:
/*jslint strict: true, maxerr: 1 */
/*global document, window*/


//##self executing anonymous function
//
// The code is surrounded by a self executing function, that is an anonymous
// function which is called just after being created: (function () {...}());
//
// Its purpose is twofold:
//
//   1. Avoid creating global variables: All variables declared in the scope of
//        the function are invisible from outside the function. If you don't
//        know why you should avoid global variables, see:
//                                http://c2.com/cgi/wiki?GlobalVariablesAreBad
//
//   2. Create a closure: Even after the anonymous function has executed, its
//        values can be referenced afterwards. This allows us to share state
//        without creating global objects. See:
//                     https://developer.mozilla.org/en/JavaScript/Guide/Closures
//
//
//
// This function is passed the document and window objects, which are
// external to our code. These are assigned short, one character variable
// names for easy access: d = document, w = window
//
(function (d, w) { 


//## strict mode
// strict mode prevents us from using questionable "features" in javascript.
//            See: http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
//
"use strict";


//## var statement
// All variables are defined under the following var statement. Under strict mode,
// variables not declared under "var" will not create a global variable, they
// will throw an error instead.
//
// Some functional programming languages don't allow a variable to be assigned
// twice. This has some good properties and allows to think about the program
// more easily. This style has been adopted, up to where it makes sense. See:
//   http://blog.objectmentor.com/articles/2007/02/26/outliving-the-great-variable-shortage
//
var

//### constants
// Constants are writen in CAPS. These are not to be changed after being
// defined. These iconstants are not language enforced, but convention-enforced.
// 
 
  // on touch devices touchstart fires earlier than click
  // double negation (!!) coerces to boolean
  //
  CLICK_EVENT = !!d.ontouchstart ? "touchstart" : "click",

  // Default state. This object must not be chaged so it's frozen. Frozen objects
  // throw an exception when they are modified. See
  //   [here](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/freeze)
  //
  // State objects should be JSON serializable, so they can be stored
  // in localStorage.
  // 
  DEFAULT_STATE = w.Object.freeze({ 
      currentPlayer: "p1",   // player whose time is running
      name: { p1: "red",     // name of each player
              p2: "blue" },
      time: false            // time remaining to each player. Not defined here.
  }),

//### undefined declared variables
// Variables declared, but not assigned have value undefined.
  interval /* = undefined */, 
  lastcall /* = undefined */,
  state    /* = undefined */,


// Alias for each of the players' buttons
  p1_button = d.querySelector("#p1"),
  p2_button = d.querySelector("#p2"),


//
//##Functions.
// Named functions are a bit counter-intuitive so we assign them to variables.
// See: http://stackoverflow.com/questions/336859/javascript-var-functionname-function-vs-function-functionname
//
 
  // converts from remaining milliseconds to readable string
  format_time = function (t) { 
    // t (in ms) is decomposed in hours, minutes and seconds.
    //
    // *  Math.floor discards the decimal part
    // *  % is modulus / remainder operator
    // *  seconds not converted to integer, so float
    var
      hours   = w.Math.floor(t / 3600000),         
      minutes = w.Math.floor(t % 3600000 / 60000),
      seconds =              t % 60000 / 1000;     
  
    // The components are put in an array so that they can be
    //   .joined afterwards. This avoids reassigning to a variable
    //   or creating unnecessary intermediate variables.
    //
    // *  .substr(-n) means "return n last characters"
    // *  the minutes part always two digits
    // *  the seconds part always 2 digits + 1 decimal
    return [
      hours,                                 
      ("00" + minutes).substr(-2),           
      ("00" + seconds.toFixed(1)).substr(-4) 

    // The following skips the hours part if it is 0. It is a bit too clever,
    // (but so elegant!)
    //
    // * if hours is 0 then !hours is "true", which + converts to 1
    //   .slice(1) returns a copy of the array without the first element (hours)
    // * if hours is 1 then !hours is "false", which + converts to 0
    //   .slice(0) returns the whole array, unchanged.
    ].slice(+!hours)                         
     // this creates the time string x:xx:xx.x
     .join(":");      
  },

  // displays remaining time on the button of each player
  display_time = function () {
    p1_button.querySelector(".time").innerHTML = format_time(state.time.p1); 
    p2_button.querySelector(".time").innerHTML = format_time(state.time.p2); 
  },

  // called about every 100 ms, updates and checks the remaining time 
  tick = function () {
    var now     = w.Date.now(),
        elapsed = now - lastcall; 

    // avoid first call edge-case
    if (lastcall) {                         

      // update current player's time.
      // Expression in () allows for multiline expression
      state.time[state.currentPlayer] = (   

        // Avoid setting it to negative values
        w.Math.max(                         
          0,                               
          state.time[state.currentPlayer] - elapsed));
    }

    lastcall = now;

    display_time();
  
    if (state.time[state.currentPlayer] <= 0) {           // currentPlayer lost
      w.clearInterval(interval);                          // stop calling tick
      w.alert(state.name[state.currentPlayer] + " lost"); // display end message
      d.querySelector(".conf").style.display = "block";   // then display time selection again
    }
  },


//
// Event handlers. These functions are called when a registered event is
// triggered. 
// 

  // Called after time selection, sets everything up.
  start_button_handler = function (event) {

      // time  for each player in ms
      var time = w.parseInt(d.querySelector(".conf select").value) * 1000;

      // stringify then parse trick creates a clone of a serializable object
      //
      // Cloned object
      // is sealed, so that no more properties can be added. This alerts us in case
      // we make a typo in assigning to a property. See:
      //   [here](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/seal)
      //
      state = w.Object.seal(

         w.JSON.parse(w.JSON.stringify(DEFAULT_STATE)));

      // set each player's time
      state.time = w.Object.seal({ p1: time,
                                   p2: time });

      // start calling tick every 100 ms
      interval = w.setInterval(tick, 100);

      // hide div.conf
      d.querySelector(".conf").style.display = "none";

      // prevent form submission
      event.preventDefault(); 
    },

  // Called when the buttons are tapped / clicked
  switch_user_handler = function (/* event, unused parameter */) { 
    // check if the tapped button is the current player's
    if (state.currentPlayer === this.id) {  

      // if so switch players
      if (state.currentPlayer === "p1") {
        state.currentPlayer = "p2";
      } else {
        state.currentPlayer = "p1";
      }
    }
  }
 // end var statement
;

// register event handler for the start button
d.querySelector(".conf form")
 .addEventListener("submit", start_button_handler, false);

// register event handler for the player's buttons
p1_button.addEventListener(CLICK_EVENT, switch_user_handler, false);
p2_button.addEventListener(CLICK_EVENT, switch_user_handler, false);


// Self-executing anonymous function invocation. document and window are
// assigned to the d and w parameters.
}(document, window)); 

