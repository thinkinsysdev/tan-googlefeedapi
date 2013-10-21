Posts = new Meteor.Collection('posts');
var arrurl = [
        'http://feeds.reuters.com/news/artsculture',
        'http://feeds.wired.com/wired/index',
        //'http://www.wired.com/reviews/feeds/latestProductsRss',
       //'http://feeds.cnevids.com/mrss/wired.xml',
       // 'http://feeds.wired.com/howtowiki'
      ];

if (Meteor.isClient) {
  Template.hello.greeting = function () {
    return "Welcome to fiber-test.";
  };
  Template.posts.helpers({
    posts: function() {
      console.log('Retrieving posts');
   return Posts.find({});
  }
  });
  Template.hello.events = {
    'submit form' : function (e) {
      e.preventDefault();
    
      var newurl = [$('#url').val()];
      console.log(newurl);
    //  var message = "You pressed the button and we ran an async job in a fiber just for fun!";
     $('#results').text('Loading...');
      
      Meteor.call('getPosts', arrurl, function(err, titles) {
        if (typeof console !== 'undefined') {
        console.log('This is truly awesome!');
        }
      });
    }
  };
}

if (Meteor.isServer) {

  var Future = Npm.require('fibers/future');
  
  var getTitle = function(result) {
    // So dirty
    var parts = result.content.split('<title>');
    return parts[1].split('</title>')[0];
  };
  
  Meteor.startup(function() {
    Posts.remove({});
    if (Posts.find().count() > 0)
//        {Posts.remove({});}
    {    
    Meteor.call('parallelAsyncJob', arrurl, function(err,titles) {
         if (typeof console !== 'undefined') {
          console.log('Fetched ' + titles.length + ' feeds: ');
          _.each(titles, function(title) {
            _.each(title, function(titletext) {
              if(titletext)
              {
               //console.log('    ' + titletext);
                Posts.insert({title: titletext});
              }
            });
          });
        }
      });
    }
  });

  Meteor.methods({
    parallelAsyncJob: function(urls) {
      
      var gfeed= Meteor.require('google-feed-api');
      var futures = _.map(urls, function(url) {
        var future = new Future();
        var onComplete = future.resolver();
        /*
        /// Make async http call
        Meteor.http.get(url, function(error, result) {

          // Get the title, if there was no error
          var title = (!error) && getTitle(result);
          
          onComplete(error, title);
        });
        */
        console.log('Running the function');
        
        var feed = new gfeed.url(url);
        feed.load(function(error,feedout) {
          
          if (error) throw error;
          console.log(feedout);
          var title = [];
          for (i=1; i< feedout.entries.length;i++){
             title[i] = (!error) && feedout.entries[i].title + '- ' + feedout.title + ' - ' + feedout.url ;
          }
         // var title = articles[0].title;
          onComplete(error, title);
        });
        
        return future;
      });
      
      // wait for all futures to finish
      Future.wait(futures);
      
      // and grab the results out.
      return _.invoke(futures, 'get'); 
    },
    getPosts: function(arrUrl) {
      Posts.remove({});
      Meteor.call('parallelAsyncJob', arrUrl, function(err,titles) {
         if (typeof console !== 'undefined') {
      //    console.log('Fetched ' + titles.length + ' feeds: ');
          _.each(titles, function(title) {
            _.each(title, function(titletext) {
              if(titletext)
              {
               //console.log('    ' + titletext);
                Posts.insert({title: titletext});
              }
            });
          });
        }
      });
    
    }
    
    
  });

}