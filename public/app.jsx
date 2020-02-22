'use strict';
let browserHistory = History.createBrowserHistory();
let combineReducers = Redux.combineReducers;
let connect = ReactRedux.connect;
let createStore = Redux.createStore;
let Provider = window.ReactRedux.Provider;
let Redirect = ReactRouterDOM.Redirect;
let Route = ReactRouterDOM.Route;
let Router = ReactRouterDOM.Router;
let Switch = ReactRouterDOM.Switch;
let withRouter = ReactRouterDOM.withRouter;


let serverUrl = 'http://127.0.0.1:3000';


let scrollDown = () => {
  window.setTimeout(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, 1);
};


let requestGetUsersCount = () => {

  let req = new XMLHttpRequest();
  let usersCount = 1;

  req.open('GET', serverUrl + '/usersCount');
  req.send(null);
  req.onload = () => {
    if (req.status === 200) {
      usersCount = JSON.parse(req.response).usersCount;
      store.dispatch({ type: 'SET_USERS_COUNT', usersCount });
    }
  }
};



/*
  Get users count with ajax until current client is connected to socket.
*/
let interval = window.setInterval(() => {
  socket.connected
    ? window.clearInterval(interval)
    : requestGetUsersCount();
}, 5000);


requestGetUsersCount();


let socket = io(serverUrl, {
  query: {
    token: window.sessionStorage.getItem('token')
  }
});


socket.on('login', user => {
  user = JSON.parse(user);
  store.dispatch({ type: 'SET_USER', user });
  browserHistory.push('/chat');
});


socket.on('message', message => {
  message = JSON.parse(message);
  store.dispatch({ type: 'PUSH_MESSAGE', message });
  scrollDown();
});


socket.on('messages', messages => {
  messages.map(message => {
    message = JSON.parse(message);
    store.dispatch({ type: 'PUSH_MESSAGE', message });
    scrollDown();
  });
});


socket.on('usersCount', data => {
  /*
    Receive number of users connected to socketio.
  */
  let usersCount = JSON.parse(data).usersCount;
  store.dispatch({ type: 'SET_USERS_COUNT', usersCount });
});


let chatState = {
  usersCount: 0
};

let chatReducer = (state = chatState, action) => {
  if (action.type === 'SET_USERS_COUNT') {
    return { usersCount: action.usersCount };
  }
  return state;
};


let messagesReducer = (state = [], action) => {
  if (action.type === 'SET_MESSAGES') {
    return action.messages;
  }
  else if (action.type === 'PUSH_MESSAGE') {
    let messages = Object.assign([], state);
    messages.push(action.message);
    state = messages;
  }
  return state;
};


let userReducer = (state = {}, action) => {
  if (action.type === 'SET_USER') {
    return action.user;
  }
  return state;
};


let store = createStore(combineReducers({
  chat: chatReducer,
  messages: messagesReducer,
  user: userReducer
}));


let Chat = () => {
  return(
    <section class="container">
      <ChatMessages />
      <ChatForm />
    </section>
  );
};


let ChatForm = (props) => {

  let submitMessage = (event) => {
    event.preventDefault();

    if ( ! event.target.message.value ) { return; }

    let message = {
      text: event.target.message.value,
      username: props.user.username
    }

    props.dispatch({ type: 'PUSH_MESSAGE', message });
    socket.emit('message', JSON.stringify(message));
    scrollDown();

    event.target.reset();
  };

  return(
    <form class="chat-form bg-white" method="POST" onSubmit={ submitMessage }>
      <div class="container flex-col flex-justify-end">
        <textarea class="form-control" name="message" rows="2" autocomplete="off" autoFocus="true"></textarea>
        <button class="btn btn-warning mt-3 flex-align-self-end" type="submit">SUBMIT</button>
      </div>
    </form>
  );
}


let ChatMessages = (props) => {
  return (
    <ul class="list-style-none chat-messages">
      {
        props.messages.map(message =>
          <li class="bg-white mb-3 p-3 p-md-6 rounded shadow animated fadeInUp faster">
            <b>{ message.username }</b> : { message.text }
          </li>
        )
      }
    </ul>
  );
};


let Home = () => {
  return(
    <section class="cover flex-center">
      <LoginForm />
    </section>
  );
};


let LoginForm = (props) => {

  let submitLoginForm = (event) => {
    event.preventDefault();

    if  ( ! event.target.username.value) { return; }

    let req = new XMLHttpRequest();
    let username = event.target.username.value;

    req.open('POST', serverUrl + '/login');
    req.setRequestHeader('content-type', 'application/json');
    req.send(JSON.stringify({ username }));
    req.onload = () => {
      if (req.status === 200) {

        let user = JSON.parse(req.response);

        props.dispatch({ type: 'SET_USER', user });
        window.sessionStorage.setItem('token', user.token);
        socket.query.token = user.token;
        socket.connect();

        return browserHistory.push('/chat');
      }
      window.alert('Selected username is invalid or already taken.');
    };
  };

  return(
    <form class="bg-white p-3 p-md-5 rounded animated fadeInUp faster" method="POST" onSubmit={ submitLoginForm }>
      <h3 class="mb-3"><strong>LOGIN</strong></h3>
      <input class="form-control" name="username" type="text" placeholder="Enter username" />
      <button class="btn btn-success mt-3 w-100" type="submit">SUBMIT</button>
    </form>
  );
};


let Navbar = (props) => {

  let logout = () => {

    let messages = [];
    let user = {};

    props.dispatch({ type: 'SET_MESSAGES', messages });
    props.dispatch({ type: 'SET_USER', user });
    window.sessionStorage.removeItem('token');
    socket.emit('logout');
    browserHistory.push('/');
    window.location.reload(); // Reload to reconnect socketio
  };

  if (props.user.username) {
    return(
      <nav class="navbar bg-white shadow animated fadeInDown faster">
        <div class="container">
          <div type="button" class="btn btn-primary">
            <span>Users online:</span>
            <span class="badge badge-light ml-2">{ props.chat.usersCount }</span>
          </div>

          <ul class="flex-align-center flex-row">
            <li>{ props.user.username }</li>
            <li><a class="btn btn-danger ml-3 text-white" onClick={ logout }>LOGOUT</a></li>
          </ul>
        </div>
      </nav>
    );
  }
  else {
    return(
      <nav class="navbar bg-white shadow animated fadeInDown faster">
        <div class="container">
          <a><strong>TELEPORT</strong>

          <div type="button" class="btn btn-primary ml-3">
            <span>Users online:</span>
            <span class="badge badge-light ml-2">{ props.chat.usersCount }</span>
          </div>

          </a>
        </div>
      </nav>
    );
  }
};


let App = () => {
  return(
    <Router history={ browserHistory }>
      <Navbar />
      <Switch>
        <Route exact path="/" component={ Home } />
        <Route exact path="/chat" component={ Chat } />
      </Switch>
    </Router>
  );
};


let mapStateToProps = (state) => {
  return {
    chat: state.chat,
    messages: state.messages,
    user: state.user
  }
};


App = connect(mapStateToProps)(App);
ChatForm = connect(mapStateToProps)(ChatForm);
ChatMessages = connect(mapStateToProps)(ChatMessages);
LoginForm = connect(mapStateToProps)(LoginForm);
Navbar = connect(mapStateToProps)(Navbar);


ReactDOM.render(
  <Provider store={ store }>
    <App />
  </Provider>,
  document.querySelector('#app')
);


window.addEventListener('resize', scrollDown);
