var posts=["728d0100c79c/","5ac32811adb9/","102a0471e3ec/","651cb7fa30c0/","1c4a5286cf6d/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };