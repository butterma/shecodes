//Load angular
let app = angular.module('lab9', []);

io({transports: ['websocket', 'polling']});

function createWS(ns) {
//Service to interact with the socket library
    app.factory(ns, function ($rootScope) {
        let skt = undefined;
        let apply = false;
        return {
            isActive: function () { return skt !== undefined },
            activate: function (callback) {
                console.log("socket.open chat");
                skt = io.connect('/' + ns);
                let args = arguments;
                skt.on('connect', function() {
                    console.log("Chat socket connected!");
                    if (callback)
                        if (apply)
                            callback.apply(skt, args);
                        else
                            $rootScope.$apply(function () {
                                apply = true;
                                callback.apply(skt, args);
                                apply = false;
                            });
                });
            },
            deactivate: function (callback) {
                console.log("socket.close chat");
                skt.disconnect();
                skt = undefined;
                let args = arguments;
                if (callback)
                    if (apply)
                        callback.apply(skt, args);
                    else
                        $rootScope.$apply(function () {
                            apply = true;
                            callback.apply(skt, args);
                            apply = false;
                        });
            },
            on: function (eventName, callback) {
                console.log("socket.on " + eventName);
                if (skt === undefined) return;
                skt.on(eventName, function () {
                    console.log("socket.on received " + eventName);
                    let args = arguments;
                    if (callback)
                        if (apply)
                            callback.apply(skt, args);
                        else
                            $rootScope.$apply(function () {
                                apply = true;
                                callback.apply(skt, args);
                                apply = false;
                            });
                });
            },
            emit: function (eventName, data, callback) {
                console.log("socket.emit " + eventName);
                if (skt === undefined) return;
                skt.emit(eventName, data, function () {
                    console.log("socket.emitted " + eventName);
                    let args = arguments;
                    if (callback)
                        if (apply)
                            callback.apply(skt, args);
                        else
                            $rootScope.$apply(function () {
                                apply = true;
                                callback.apply(skt, args);
                                apply = false;
                            });
                })
            }
        };
    });
}

createWS('chat');

//ng-enter directive
app.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter);
                });
                event.preventDefault();
            }
        });
    };
});

//Our Controller
app.controller('MainCtrl', function ($scope, chat, $http) {

    function init() {
        //Global Scope
        $scope.messages = [];
        $scope.room = "";
        $scope.rooms = [];
        $scope.username = "";
        $scope.inputUser = "";
        $scope.message = "";
        $scope.selected = { group : "" };
    }

    init();
    console.log("Init MainCtrl");

    $scope.login = function() {
        $('#login').css('display', 'none');
        $scope.username = "logging in...";
        $http.post("/users/login", {username: $scope.inputUser})
            .then(function good() {
                console.log("POST /login response");
                chat.activate(function() {
                    console.log("chat socket activated");
                    register();
                    chat.emit('login', {username: $scope.username});
                });
            }, function bad() {
                init();
            });
    };

    $scope.logout = function() {
        console.log("emit logout");
        chat.emit('logout', {username: $scope.username}, function() {
            console.log("closing chat socket");
            chat.deactivate(function() { init(); });
        });
    };

    $scope.change = function() {
        console.log("SWITCH: " + $scope.selected.group);
        $http.get('/msgs?room=' + $scope.selected.group)
            .then(function(resp) {
                msgs = resp.data;
                console.log(msgs);
                if(msgs instanceof Array) {
                    $scope.room = $scope.selected.group;
                    chat.emit('switch', {username: $scope.username, newRoom: $scope.room});
                    $scope.messages = msgs;
                }
                else
                    $scope.selected.group = $scope.room;
            });
    };

    function register () {
        //Listen for the setup event and create rooms
        chat.on('setup', function (data) {
            console.log("socket.io: setup " + JSON.stringify(data));
            $scope.rooms = data.rooms;
            if (data.rooms.length > 0) {
                $scope.username = $scope.inputUser;
                console.log($scope.selected);
                $scope.selected.group = $scope.room = data.rooms[0];
                console.log($scope.selected.group);
                $http.get('/msgs?room=' + $scope.selected.group)
                    .then(function(resp) {
                        msgs = resp.data;
                        console.log(msgs);
                        if(msgs instanceof Array)
                            $scope.messages = msgs;
                        else
                            init();
                    });
            } else {
                $http.post("/users/logout")
                    .then(function good() {
                        console.log("POST /logout response");
                        init();
                    }, function bad() {
                        init();
                    });
            }
        });

        //Listen for new messages (Objective 3)
        chat.on('message', function (data) {
            console.log("socket.io: message");
            //Push to new message to our $scope.messages
            $scope.messages.push(data);
        });

        chat.on('joined', function (data) {
            console.log("socket.io: joined");
            if (data.username !== $scope.username) {
                let message = {username: data.username, content: "joined the room"};
                $scope.messages.push(message);
                console.log(JSON.stringify($scope.messages));
            }
        });

        chat.on('left', function (data) {
            console.log("socket.io: joined");
            if (data.username !== $scope.username)
                let message = {username: data.username, content: "left the room"};
            $scope.messages.push(message);
            console.log(JSON.stringify($scope.messages));
        });

        chat.on("disconnect", function() {
            console.log("server disconnected");
            chat.deactivate(function() { init(); });
        });
    }

    //Send a new message (Objective 4)
    $scope.send = function (msg) {
        if (!chat.isActive()) {
            alert('Please login first!');
            return;
        }
        //Notify the server that there is a new message with the message as packet
        chat.emit('message', {
            room: $scope.room,
            message: msg,
            username: $scope.username
        });
        //Empty the textarea
        $scope.message = "";
    };

});

//Dialog controller
function UsernameDialogController($scope, $mdDialog) {
    $scope.answer = function (answer) {
        $mdDialog.hide(answer);
    };
}
