var CanvasView = Backbone.View.extend({
                                      initialize : function(options){
                                      options = options || {};
                                      this.container = options.container || new createjs.Container();
                                      this.canvasEvents(this.cEvents);
                                      this.init(options);
                                      },
                                      init : function(options){
                                      },
                                      canvasEvents : function(cEvents){
                                      if (!cEvents) return this;
                                      for (var key in cEvents){
                                      var method = cEvents[key];
                                      if (!_.isFunction(method)) method = this[cEvents[key]];
                                      if (!method) continue;
                                      method = _.bind(method, this);
                                      var eventName = key;
                                      this.container.on(eventName, method, this);
                                      }
                                      return this;
                                      }
                                      });

var GenRand = Backbone.Model.extend({
                                    genRand: function(nnums, values, weights, replaceToggle){
                                    if(replaceToggle) // if true then with replacement
                                    return this.genRandWithReplacement(nnums, values, weights);
                                    else
                                    return this.genRandWithoutReplacement(nnums, values, weights);
                                    },
                                    genRandWithReplacement: function(nnums, values, weights){
                                    var retnums = new Array()
                                    var pdf = new Array();
                                    var cdf = new Array();
                                    var i, j;
                                    var s = 0;
                                    var rand;
                                    for(i = 0; i < weights.length; i++){
                                    s += weights[i];
                                    }
                                    for(i = 0; i < weights.length; i++){
                                    pdf[i] = weights[i]/s;
                                    }
                                    cdf[0] = pdf[0];
                                    for(i = 1; i < weights.length; i++){
                                    cdf[i] = cdf[i-1] + pdf[i];
                                    }
                                    for(i = 0; i < nnums; i++){
                                    rand = Math.random();
                                    for(j = 0; j < cdf.length; j++)
                                    {
                                    if(cdf[j] > rand){
                                    retnums[i] = values[j];
                                    break;
                                    }
                                    }
                                    }
                                    return retnums.slice(0,nnums);
                                    },
                                    genRandWithoutReplacement: function(nnums, values, weights){
                                    var retnums = new Array();
                                    var dist = new Array();
                                    var i,j, count=0;
                                    for(i = 0; i < weights.length; i++){
                                    for(j = 0; j < weights[i]; j++){
                                    dist[count] = values[i];
                                    count += 1;
                                    }
                                    }
                                    dist = this.shuffle(dist);
                                    return dist.slice(0,nnums);
                                    },
                                    shuffle: function(arr){
                                    var i = 0, r, temp;
                                    for(i = 0; i < arr.length; i++){
                                    r = Math.floor(Math.random()*(arr.length-i));
                                    temp = arr[i];
                                    arr[i] = arr[arr.length-1-r];
                                    arr[arr.length-1-r] = temp;
                                    }
                                    return arr;
                                    }
                                    });


var MasterPathCollection = Backbone.Collection.extend({
                                                      initialize: function () {this.pathhash = "";},
                                                      isTileInPath: function (model) {
                                                      if (this.indexOf(model) != -1) {
                                                      return true;
                                                      }
                                                      return false;
                                                      },
                                                      addTile: function (model) {
                                                      this.add(model);
                                                      },
                                                      getLastTile: function () {
                                                      if(this.length === 0){
                                                      return null;
                                                      }
                                                      return this.at(this.length - 1);
                                                      },
                                                      getPath: function () {
                                                      return this;
                                                      },
                                                      setPath: function (modelarray) {
                                                      this.set(modelarray);
                                                      },
                                                      clearPath: function(){
                                                      this.reset([]);
                                                      },
                                                      hashify: function () {
                                                      var modelids = this.pluck("id");
                                                      this.pathhash = "";
                                                      _.each(modelids, function (id) {
                                                             this.pathhash += id.toString() + ";";
                                                             });
                                                      return this.pathhash;
                                                      },
                                                      updatePathHash: function (model) {
                                                      this.pathhash += model.get("id").toString() + ";";
                                                      },
                                                      getPathHash: function () {
                                                      return this.pathhash;
                                                      }
                                                      });

var GamePathCollection = MasterPathCollection.extend({
                                                     initialize: function(){
                                                     this.pathhash = "";
                                                     this.currentsum = 0;
                                                     this.complete = false;
                                                     this.valid = false;
                                                     },
                                                     clearPath: function(){
                                                     var that = this;
                                                     this.initialize();
                                                     this.each(function(m){
                                                               m.set({inPath: false});
                                                               });
                                                     that.reset();
                                                     that.trigger('path:cleared');
                                                     },
                                                     evaluate: function () {
                                                     var that = this;
                                                     var currsum = 0;
                                                     var modelvalues = this.pluck("value");
                                                     this.currentsum = 0;
                                                     _.each(modelvalues, function (v) {
                                                            if (v.indexOf("=") > -1) {}
                                                            else {
                                                            that.currentsum += parseInt(v,10);
                                                            }
                                                            return that.currentsum;
                                                            });
                                                     },
                                                     isPathComplete: function () {
                                                     return this.complete;
                                                     },
                                                     isPathValid: function () {
                                                     return this.valid;
                                                     },
                                                     addTile: function (tile) {
                                                     if (this.complete === true) {
                                                     return null;
                                                     }
                                                     MasterPathCollection.prototype.addTile.apply(this, arguments);
                                                     if (tile.get("value").indexOf("=") > -1) {
                                                     this.complete = true;
                                                     tile.set({
                                                              inPath: true
                                                              });
                                                     this.updatePathHash(tile);
                                                     this.trigger("path:complete");
                                                     if (this.currentsum === parseInt(tile.get("value").substr(1), 10)){
                                                     this.valid = true;
                                                     this.trigger("path:valid");
                                                     }
                                                     } else {
                                                     this.complete = false;
                                                     tile.set({
                                                              inPath: true
                                                              });
                                                     this.updatePathHash(tile);
                                                     this.evaluate();
                                                     this.trigger("path:tileadded");
                                                     }
                                                     return true;
                                                     }
                                                     });

function AdjacencyMatrix(nboxes){
    this.nboxes = nboxes;
    this.adjacencymatrix = new Array(this.nboxes);
    var i, j;
    for(i = 0; i < this.nboxes; i++){
        this.adjacencymatrix[i] = new Array(this.nboxes);
        for(j = 0; j < this.nboxes; j++){
            this.adjacencymatrix[i][j] = 0;
        }
    }
}

AdjacencyMatrix.prototype.getEdge = function(n1,n2){
    return this.adjacencymatrix[n1][n2];
};

AdjacencyMatrix.prototype.setEdge = function(n1, n2, val){
    if(n1 < 0 || n2 < 0 || n1 >= this.nboxes || n2 >= this.nboxes){
        return null;
    }
    this.adjacencymatrix[n1][n2] = val;
    return true;
};

AdjacencyMatrix.prototype.setEdgeSymmetric = function(n1, n2, val){
    var q = this.setEdge(n1,n2,val);
    if(q === null){return null;}
    q = this.setEdge(n2,n1,val);
    if(q === null){return null;}
    return true;
};

var BoardCollection = Backbone.Collection.extend({
                                                 init : function(options){
                                                 options = options || {};
                                                 this.edgeLength = options.edgeLength || 5;
                                                 this.numberOfTiles = this.edgeLength * this.edgeLength;
                                                 _.bind(this.createBoard, this);
                                                 _.bind(this.generateTiles, this);
                                                 _.bind(this.isAdj, this);
                                                 _.bind(this.tileById, this);
                                                 this.shape = options.shape || "square";
                                                 this.createBoard(this.edgeLength);
                                                 this.genRand = new GenRand();
                                                 if (this.length != this.numberOfTiles){
                                                 this.generateTiles(this.numberOfTiles);
                                                 }
                                                 },
                                                 tileById : function(id){
                                                 return this.get(id);
                                                 },
                                                 isAdj : function(tile1, tile2){
                                                 var n1 = this.indexOf(tile1);
                                                 var n2 = this.indexOf(tile2);
                                                 if (this.adjacencyMatrix.getEdge(n1, n2) == 1){
                                                 return true;
                                                 } else {
                                                 return false;
                                                 }
                                                 },
                                                 generateTiles : function(nTiles){
                                                 var that = this;
                                                 console.log(nTiles);
                                                 var numberUniverse = ["-3", "-2", "-1", "+1", "+2", "+3", "+0", "=2"];
                                                 var distNum = Math.ceil((nTiles - 1)/(numberUniverse.length));
                                                 var weightArray = [];
                                                 for (var i = 0; i < numberUniverse.length; i++){
                                                 weightArray.push(distNum);
                                                 }
                                                 this.valueDeck = that.genRand.genRandWithoutReplacement(nTiles - 1, numberUniverse, weightArray);
                                                 this.valueDeck = that.genRand.shuffle(that.valueDeck);
                                                 this.valueDeck.splice((nTiles - 1)/2, 0, "=5");
                                                 var modelArray = []
                                                 for (var i = 0; i < nTiles; i++){
                                                 var myVal = this.valueDeck[i];
                                                 var isEnd = this.valueDeck[i].indexOf('=') > -1;
                                                 modelArray.push({id: i.toString(), value: myVal, inPath: false, endTile: isEnd});
                                                 }
                                                 this.reset(modelArray);
                                                 },
                                                 createSquareBoard : function(edgeLength){
                                                 var that = this;
                                                 that.adjacencyMatrix = new AdjacencyMatrix(edgeLength*edgeLength);
                                                 var addNeighbors = function(i,j){
                                                 var deltas = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1,1]];
                                                 _.each(deltas, function(tupe){
                                                        var neighbor = [i + tupe[0], j + tupe[1]];
                                                        if (neighbor[0] >= 0 && neighbor[0] < edgeLength && neighbor[1] >= 0 && neighbor[1] < edgeLength){
                                                        that.adjacencyMatrix.setEdge(neighbor[0]*edgeLength + neighbor[1], i*edgeLength + j, 1);
                                                        }
                                                        });
                                                 };
                                                 _.each(_.range(edgeLength), function(i){
                                                        _.each(_.range(edgeLength), function(j){
                                                               addNeighbors(i,j);
                                                               });
                                                        });
                                                 },
                                                 createBoard : function(edgeLength){
                                                 this.createSquareBoard(edgeLength);  
                                                 }
                                                 });

var GameTileModel = Backbone.Model.extend({
                                          defaults: {
                                          value: "",
                                          id: "",
                                          inPath: false,
                                          endTile: false
                                          }
                                          });

var Scorer = Backbone.Model.extend({
                                   scorePath : function(path){
                                   return path.length;
                                   }
                                   });

var Logger = Backbone.Collection.extend({ 
                                        log : function(hashPath, score){
                                        console.log(hashPath, score);
                                        this.add({hash: hashPath, score: score});
                                        },
                                        hasPath : function(hashPath){
                                        var ans = this.where({hash: hashPath}).length > 0;
                                        return ans;   
                                        }
                                        });

var Clock = Backbone.Model.extend({});

var GameController = Backbone.Model.extend({
                                           defaults : { score: 0, edgeLength : 5 },
                                           initialize: function(){
                                           var game = this;
                                           game.scorer = new Scorer();
                                           game.path = new GamePathCollection();
                                           game.logger = new Logger();
                                           game.clock = new Clock();
                                           game.board = new BoardCollection([], {model: GameTileModel});
                                           game.board.init({edgeLength: game.get('edgeLength')});
                                           game.listenTo(game, 'tile:selected', game.handleSelection);
                                           game.listenTo(game, 'path:ended', function(){game.cancelPath(); console.log("canceling");}, game);
                                           game.listenTo(game.clock, 'minutes:3', function(){game.trigger('gameover')});
                                           game.listenTo(game, 'gameover', game.endGame, game);
                                           },
                                           handleSelection : function(data){
                                           var game = this;
                                           var tileId = data.id;
                                           var thisTile = game.board.tileById(tileId);
                                           if (!_.isUndefined(thisTile)){      
                                           game.addTile(thisTile);
                                           }
                                           },
                                           endGame : function(){
                                           alert("Game over man, your score: "+this.get('score'));
                                           },
                                           cancelPath : function(){
                                           this.path.clearPath();
                                           },
                                           canAddTile : function(tile){
                                           var game = this;
                                           var lastTile = game.path.getLastTile();
                                           if (lastTile === null){
                                           console.log("null path");
                                           return true;
                                           }
                                           console.log("not null last", lastTile);
                                           if (game.board.isAdj(tile, lastTile)){
                                           console.log("is adj");
                                           if (!game.path.isTileInPath(tile)){
                                           return true;   
                                           }
                                           }
                                           return false;
                                           },
                                           addTile : function(tile){
                                           var game = this;
                                           if (game.canAddTile(tile)){
                                           game.path.addTile(tile);
                                           if (game.path.isPathValid()){
                                           var pathHash = game.path.getPathHash();
                                           if (!game.logger.hasPath(pathHash)){
                                           var pathScore = game.scorer.scorePath(game.path);
                                           game.set({score: game.get('score') + pathScore});
                                           game.logger.log(game.path.getPathHash(), pathScore);
                                           game.trigger('path:scored', {path: game.path.pluck('value').join(' ')});
                                           game.path.each(function(model){ model.trigger('tile:scored')});
                                           }
                                           }
                                           if (game.path.isPathComplete()){
                                           game.path.clearPath();
                                           }
                                           }
                                           }
                                           });

var UiBrain = Backbone.Model.extend({ 
                                    initialize : function(options){
                                    options = options || {};
                                    this.edge = options.edge || 100;
                                    this.mouseDown = false;
                                    this.gutter = options.gutter || 10;
                                    this.containerArray = {};
                                    }
                                    });

var ScoreView = CanvasView.extend({
                                  init: function(options){
                                  this.listenTo(this.model, "change:score", this.render, this);
                                  this.ui = options.ui;
                                  },
                                  render :  function(){
                                  this.container.removeAllChildren();
                                  var text = new createjs.Text("Score: "+this.model.get('score'), "20px Arial", "#ff0000"); 
                                  text.textBaseline = "alphabetic";
                                  text.x = this.ui.get('gutter') + 20;
                                  text.y = this.ui.get('gutter') + (this.ui.get('edge') + this.ui.get('gutter'))*this.ui.get('n') + 50;
                                  this.container.addChild(text);
                                  //this.container.x = ui.get('width');
                                  return this;
                                  }
                                  });

var CurrentPathView = CanvasView.extend({
                                        init: function(options){
                                        this.listenTo(this.collection, "all", this.render, this);
                                        this.ui = options.ui;
                                        },
                                        render : function(){
                                        this.container.removeAllChildren();
                                        var text = new createjs.Text(this.collection.pluck('value').join(' ') + " = "+this.collection.currentsum, "24px Arial", "#ff0000"); 
                                        text.textBaseline = "alphabetic";
                                        text.x = this.ui.get('gutter') + 20;
                                        text.y = this.ui.get('gutter') + (this.ui.get('edge') + this.ui.get('gutter'))*this.ui.get('n') + 20;
                                        this.container.addChild(text);
                                        //this.container.y = ui.get('height');
                                        return this;   
                                        }
                                        });

var BoxView = CanvasView.extend({
                                init : function(options){
                                this.game = options.game;
                                this.ui = options.ui;
                                this.hover = false;
                                this.mousein = false;
                                this.ui.containerArray[this.container.id] = this;
                                //this.options = options;
                                this.listenTo(this.game, 'myexit', this.touchexit, this);
                                this.listenTo(this, 'myenter', this.touchenter, this);
                                this.listenTo(this.model, 'change:inPath', this.render, this);
                                //this.listenTo(this.model, 'tile:scored', this.scoreAnimate, this);
                                createjs.EventDispatcher.initialize(this.container);
                                },
                                cEvents : {
                                "click" : "handleClick",
                                "mousedown" : "mouseDown",
                                "rollover" : "mouseIn",
                                "rollout" : "mouseOut"
                                },
                                touchexit : function(){
                                if (this.mousein){
                                this.mousein = false;
                                this.hover = false;
                                this.render();
                                }
                                },
                                touchenter: function(){
                                if (this.mousein == false){
                                this.mousein = true;
                                this.mouseIn();
                                }
                                },
                                handleClick : function(){
                                this.mouseUp();
                                },
                                mouseDown : function(){
                                this.ui.mouseDown = true;
                                this.game.trigger("tile:selected", {id: this.model.id});
                                },
                                mouseIn : function(){
                                if (this.ui.mouseDown){
                                this.game.trigger("tile:selected", {id: this.model.id});
                                }
                                this.hover = true;
                                this.render();
                                },
                                mouseOut : function(){
                                this.hover = false;
                                this.render();
                                },
                                scoreAnimate : function(){
                                //console.log("scoring tile "+this.model.id);
                                this.tickCounter = 0;
                                var tickFunc = function(){
                                this.tickCounter += 1;
                                var modulus = 2;
                                if (this.tickCounter % modulus == 0){
                                this.container.x += 1;
                                this.container.y += 1;
                                }
                                if (this.tickCounter == modulus*5){
                                //this.stopListening();
                                this.tickCounter = 0;
                                this.container.x -= 5;
                                this.container.y -= 5;
                                //this.initialize(this.options);
                                }
                                };
                                this.listenTo(createjs.Ticker, 'tick', tickFunc, this);
                                },
                                render : function(){
                                this.container.removeAllChildren();
                                this.box = new createjs.Shape();
                                var myColor;
                                var endTile = false;
                                if (this.model.get('endTile')){
                                endTile = true;
                                myColor = this.hover ? "#118811" : "#11BB11";
                                } else {
                                myColor = this.hover ? "#FF02FF" : "#9900FF";
                                }
                                if (!endTile){                   this.box.graphics.beginFill(myColor).drawRoundRect(0,0,this.ui.get('edge'),this.ui.get('edge'), this.ui.get('radius'));
                                } else {
                                var myRadius = this.ui.get('edge')/2; this.box.graphics.beginFill(myColor).drawPolyStar(myRadius,myRadius,myRadius, 6, .6, -90);
                                }
                                this.box.shadow = new createjs.Shadow("#000000", 5, 5, 10);
                                this.container.addChild(this.box);
                                
                                if (this.model.get('inPath') == true){
                                this.border = new createjs.Shape();
                                this.border.graphics.beginStroke("#999900").setStrokeStyle(10).drawRoundRect(0,0,this.ui.get('edge'), this.ui.get('edge'), this.ui.get('radius'));
                                this.container.addChild(this.border);
                                }
                                
                                var text = new createjs.Text(this.model.get('value'), "20px Arial", "#ffFFff"); 
                                text.textBaseline = "alphabetic";
                                var tBounds = text.getBounds();
                                text.x = this.ui.get('edge')/2 - tBounds.width/2;
                                text.y = this.ui.get('edge')/2 + tBounds.height/4;
                                this.container.addChild(text);
                                this.container.x = 200;
                                var pEdge = this.ui.get('edge');
                                var gutter = this.ui.get('gutter');
                                var n = this.game.get('edgeLength');
                                var boxx = gutter + (pEdge + gutter)*(this.model.id % n);
                                var boxy = gutter + (pEdge + gutter)*(Math.floor(this.model.id / n));
                                this.container.x = boxx;
                                this.container.y = boxy;
                                return this;
                                }
                                });



var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();

    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {

var eLen = 5;
var game = new GameController({edgeLength: eLen});
var bc = game.board;
var stage = new createjs.Stage("gameCanvas");
stage.enableMouseOver(10);
createjs.Touch.enable(stage);
createjs.EventDispatcher.initialize(stage);
stage.addEventListener('stagemousedown', function(){
   ui.mouseDown = true; 
});
stage.addEventListener('stagemouseup', function(){
   ui.mouseDown = false;
   game.trigger("path:ended");
});
        
function handleTick(event) {
    stage.update();
}
        var ui = new UiBrain({edge: 45, gutter: 12, stage: stage, width: $("#gameCanvas").width(), height: $("#gameCanvas").height(), radius: 10, n: game.get('edgeLength')});
        ui.listenTo(game.path, "path:complete", function(){ ui.mouseDown = false; });
        var viewArray = [];
        var myView;
        game.board.each(function(model){
                        myView = new BoxView({model : model, game: game, ui : ui});
                        viewArray.push(myView);
                        stage.addChild(myView.render().container);
                        });
        
        var scoreView = new ScoreView({model: game, ui: ui});
        stage.addChild(scoreView.render().container);
        
        var pathView = new CurrentPathView({collection: game.path, ui: ui});
        stage.addChild(pathView.render().container);
        
        createjs.Ticker.addEventListener("tick", handleTick);
        
        function handleTick(event) {
            stage.update();
        }
        
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
       /* var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);*/
    }
};
