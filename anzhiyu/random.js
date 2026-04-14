var posts=["651cb7fa30c0/","5ac32811adb9/","1c4a5286cf6d/","728d0100c79c/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };