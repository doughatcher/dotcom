if (window.location.pathname !== '/') {
  // eslint-disable-next-line func-names
  window.onload = function () {
    // Create a new div element
    const disqusDiv = document.createElement('div');

    // Set the id of the new div
    disqusDiv.id = 'disqus_thread';

    // Find the first element with the class 'default-content-wrapper'
    const contentWrapper = document.querySelector('.default-content-wrapper');

    // Append the new div to the 'default-content-wrapper' div
    if (contentWrapper) {
      contentWrapper.appendChild(disqusDiv);
    }

    /**
         *  RECOMMENDED CONFIGURATION VARIABLES: EDIT AND UNCOMMENT
         *  THE SECTION BELOW TO INSERT DYNAMIC VALUES FROM YOUR
         *  PLATFORM OR CMS.
         *
         *  LEARN WHY DEFINING THESE VARIABLES IS IMPORTANT:
         *  https://disqus.com/admin/universalcode/#configuration-variables
         */

    // eslint-disable-next-line func-names
    (function () { // REQUIRED CONFIGURATION VARIABLE: EDIT THE SHORTNAME BELOW
      const d = document; const
        s = d.createElement('script');

      // IMPORTANT: Replace EXAMPLE with your forum shortname!
      s.src = 'https://superterran.disqus.com/embed.js';

      s.setAttribute('data-timestamp', +new Date());
      (d.head || d.body).appendChild(s);
    }());
  };
}
