var posts=["728d0100c79c/","5ac32811adb9/","651cb7fa30c0/","25ea3413e775/","1c4a5286cf6d/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };