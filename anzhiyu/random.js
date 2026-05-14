var posts=["728d0100c79c/","1c4a5286cf6d/","5ac32811adb9/","651cb7fa30c0/","102a0471e3ec/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };