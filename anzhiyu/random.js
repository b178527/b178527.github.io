var posts=["102a0471e3ec/","728d0100c79c/","651cb7fa30c0/","1c4a5286cf6d/","5ac32811adb9/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };