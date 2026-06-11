var posts=["728d0100c79c/","651cb7fa30c0/","5ac32811adb9/","4b0dd9840b90/","1c4a5286cf6d/","102a0471e3ec/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };