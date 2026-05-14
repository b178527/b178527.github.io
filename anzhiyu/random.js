var posts=["f03a7354ba49/","5ac32811adb9/","651cb7fa30c0/","1c4a5286cf6d/","728d0100c79c/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };