var posts=["4b0dd9840b90/","728d0100c79c/","102a0471e3ec/","651cb7fa30c0/","5ac32811adb9/","1c4a5286cf6d/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };