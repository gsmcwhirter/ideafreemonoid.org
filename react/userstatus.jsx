var React = require('react');

var UserStatus = React.createClass({
    getInitialState: function (){
        return {user: null};
    },
    onLogin: function (){
        //TODO: try to log in
        this.setState({user: "Greg"});
    },
    onLogout: function (){
        //TODO: try to log out
        this.setState({user: null});
    },
    render: function (){
        if (!this.state.user){
            return (
                <div>
                    <input type="text" name="username" placeholder="Username" />
                    <input type="password" name="password" placeholder="Password" />
                    <button onClick={this.onLogin}>Log in</button>
                </div>
            );
        }
        else {
            return (
                <div>
                    <span className="userInfo">Logged in: {this.state.user}</span>
                    <button onClick={this.onLogout}>Log out</button>
                </div>
            );
        }
    }
});

module.exports = UserStatus;
