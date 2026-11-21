/**
 * Quabbin PC Repair — site settings.
 *
 * This is the only file you need to edit before publishing.
 * Leave a value as "" to switch that feature off.
 */
window.QPR_CONFIG = {
  /**
   * The email address repair requests should go to, e.g. "hello@yourdomain.com".
   * While this is empty the site shows "Email address not set yet" and the
   * form runs in clearly labeled demo mode (nothing is sent).
   */
  contactEmail: "quabbinrepair@gmail.com",

  /**
   * Optional phone number to show in the contact section.
   * Shown exactly as written here, e.g. "(978) 555-0100". Leave "" to hide it.
   */
  phone: "",

  /**
   * Optional free form service endpoint (no backend of your own needed).
   * Example for Formspree: "https://formspree.io/f/abcdwxyz"
   * Any service that accepts a standard POST and returns a 2xx status works.
   *
   * - Set:   the form submits in the background and only shows "Request sent"
   *          if the service confirms it received it.
   * - Empty: the form opens the visitor's email app with the request filled in
   *          (needs contactEmail above).
   */
  formEndpoint: "",

  /** Subject line used for emailed requests. */
  emailSubject: "Repair request"
};
