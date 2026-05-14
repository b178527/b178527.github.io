var posts=["5ac32811adb9/","728d0100c79c/","651cb7fa30c0/","1c4a5286cf6d/","25ea3413e775/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };