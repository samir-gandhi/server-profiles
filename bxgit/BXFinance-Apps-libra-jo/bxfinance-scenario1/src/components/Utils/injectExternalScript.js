/** 
 * ExternalScripts
 * Appends a script element to the DOM setting the src attibute to a given argument.
 * @param {String} scriptToInject - the relative path to the script.
 * @param {String} execWhen - When the script should execute; ["async" | "defer"]. No argument means immediately.
 * @return void
*/
export const injectExternalScript = (scriptToInject, execWhen) => {
    const script = document.createElement("script");
    script.src = scriptToInject;
    if (execWhen === "async") {
        script.async = true;
    } else if (execWhen === "defer") {
        script.defer = true;
    }
    document.body.appendChild(script);
}