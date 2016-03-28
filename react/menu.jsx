var React = require('react');
var Link = require('react-router').Link;

var Menu = React.createClass({
    getInitialState: function ()
    {
        return {menuItems: [{id: 0, url: "/", title: "Home"}, {id: 1, url: "/blog", title: "Blog"}, {id: 2, url:"/cv/", title: "CV"}, {id: 3, url: "/portfolio/", title: "Portfolio"}]};
    },
    componentDidMount: function (){
        // this.serverRequest = $.get("/api/v1/menu", function (result){
        //     //when done fetching
        //     this.setState(result);
        // }.bind(this));
    },
    componentWillUnmount: function (){
        // this.serverRequest.abort();
    },
    render: function (){
        return (
            <nav id="menu">
                <ul>
                    {this.state.menuItems.map(function (page){
                        if (!page.remote)
                        {
                            return <li key={page.id}><Link to={page.url}>{page.title}</Link></li>;
                        }
                        else {
                            return <li key={page.id}><a href={page.url}>{page.title}</a></li>;
                        }
                    })}
                </ul>
            </nav>
        );
    }
});

module.exports = Menu;
