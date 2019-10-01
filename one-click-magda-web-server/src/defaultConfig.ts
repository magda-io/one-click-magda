export default {
  csp: {
    directives: {
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"]
    },
    browserSniff: false
  },
  helmet: {},
  cors: {}
};
