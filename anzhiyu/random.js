var posts=["728d0100c79c/","5ac32811adb9/","651cb7fa30c0/","4b0dd9840b90/","102a0471e3ec/","1c4a5286cf6d/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };