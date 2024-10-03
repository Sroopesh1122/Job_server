export const parsePackage = (packageStr) => {


    if (packageStr.toLowerCase() === "not disclosed") {
        return { min: null, max: null };
      }

    const lpaMultiplier = 100000; 
    let min = null, max = null;
  
    if (packageStr.includes("LPA") || packageStr.toLowerCase().includes("lpa")) {
      const [minStr, maxStr] = packageStr.split('-').map(str => str.trim().replace(/[^0-9.]/g, ''));
      min = parseFloat(minStr) * lpaMultiplier;
      max = maxStr ? parseFloat(maxStr) * lpaMultiplier : min;
    } else if (packageStr.includes('K') || packageStr.toLowerCase().includes('k')) {
      const [minStr, maxStr] = packageStr.split('-').map(str => str.trim().replace(/[^0-9.]/g, ''));
      min = parseFloat(minStr) * 1000;
      max = maxStr ? parseFloat(maxStr) * 1000 : min;
    } else if (packageStr.includes('$')) {
      const [minStr, maxStr] = packageStr.split('-').map(str => str.trim().replace(/[^0-9.]/g, ''));
      min = parseFloat(minStr);
      max = maxStr ? parseFloat(maxStr) : min;
    }
  
    return { min, max };
  };
  