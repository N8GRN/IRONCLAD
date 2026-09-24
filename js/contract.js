window.IC = window.IC || {};

(function (IC) {
  IC.companyBlock = function (s) {
    return [
      s.legalName,
      s.dba && s.dba !== s.legalName ? "d/b/a " + s.dba : "",
      s.street,
      [s.city, s.state].filter(Boolean).join(", ") + (s.zip ? " " + s.zip : ""),
      s.phone ? "Tel: " + s.phone : "",
      s.email,
      s.licenseNumber ? "License " + s.licenseNumber : "",
    ].filter(function (x) { return x && String(x).trim(); });
  };

  IC.scopeLines = function (job, estimate) {
    var items = [];
    if (job.includeRoof) {
      items.push(
        "Complete tear-off of existing roofing materials down to the deck (as specified), inspection of sheathing, replacement of damaged sheathing as allowed in this Agreement, installation of underlayment, ice-and-water protection at eaves and valleys, flashing, ventilation components, and new architectural shingles of the color/style specified in the estimate."
      );
      if (estimate) {
        items.push("Shingle selection: " + IC.pickName(estimate, "shingle") + ".");
        estimate.structures.forEach(function (st) {
          var facets = IC.structureFacets(st);
          var levels = [];
          facets.forEach(function (f) { if (levels.indexOf(f.level) < 0) levels.push(f.level); });
          items.push(
            st.name + ": " + st.squares + " squares, " + st.type + ", " + (levels.join(" / ") || st.level) +
            ", pitch " + st.pitch + ", tear-off " + st.tearoff + ", deck " + st.sheathing +
            " (replace " + (st.sheathingSheets != null && st.sheathingSheets !== "" ? st.sheathingSheets : "approx. " + st.sheathingReplacePct + "%") +
            (st.sheathingSheets != null && st.sheathingSheets !== "" ? " sheets" : "") + ")."
          );
        });
      }
    }
    if (job.includeGutters || (estimate && estimate.gutters && estimate.gutters.included)) {
      items.push("Gutters: " + ((estimate && estimate.gutters && estimate.gutters.description) || "Seamless gutters and downspouts as specified."));
    }
    if (job.includeSiding || (estimate && estimate.siding && estimate.siding.included)) {
      items.push("Siding: " + ((estimate && estimate.siding && estimate.siding.description) || "Siding as specified."));
    }
    if (estimate && estimate.notes) items.push(estimate.notes);
    if (job.notes) items.push("Job notes: " + job.notes);
    return items;
  };

  IC.contractTitle = function (job) {
    var parts = ["Roofing"];
    if (job.includeGutters) parts.push("Gutters");
    if (job.includeSiding) parts.push("Siding");
    return parts.join(" / ") + " Service Agreement";
  };

  IC.buildContract = function (job, customer, settings) {
    var estimate = job.estimate;
    var total = job.price || (estimate && estimate.computed && estimate.computed.total) || 0;
    var name = customer ? IC.fullName(customer.firstName, customer.lastName) : job.customerName;
    var property = customer ? IC.customerAddress(customer) : "";
    var contact = customer ? [customer.phone, customer.email].filter(Boolean).join(" · ") : "";
    var years = settings.warrantyWorkmanshipYears;
    var payment = (job.contract && job.contract.paymentTerms) || settings.paymentTerms;
    var articles = [
      { heading: "1. Price", body: "Customer agrees to pay Contractor the sum of " + IC.money(total) + " (the “Contract Price”) for the work described in this Agreement. The Contract Price is based on the conditions reasonably observable at the time of estimate. Concealed damage, extra layers of roofing, rotten or damaged decking beyond the allowance stated in the estimate, code upgrades, and customer-requested changes are extra and will be billed by written change order." },
      { heading: "2. Payment", body: payment },
      { heading: "3. Start and weather", body: "Start date is an estimate and is subject to weather, material availability, prior jobs, and permitting. Contractor may interrupt work when conditions would compromise a watertight, workmanlike result. Contractor will make reasonable efforts to keep the property watertight overnight while the job is open." },
      { heading: "4. Change orders", body: "Any change to the scope, materials, or price must be in writing (including a text or email confirmation) and signed or acknowledged by Customer. Contractor is not obligated to perform extra work without a change order." },
      { heading: "5. Access and site", body: "Customer will provide safe access to the property, electricity, and a water source; relocate vehicles, patio furniture, and grills from the work area; secure pets; and identify underground utilities, septic, and irrigation in the driveway and staging areas. Contractor is not responsible for damage to unmarked utilities, landscaping in the dumpster/drop zone, or satellite dishes / antennas left on the roof." },
      { heading: "6. Permits and code", body: "Unless otherwise stated, Contractor will pull the roofing permit where required. Any additional work required by the building official that is not in the estimate is extra." },
      { heading: "7. Insurance", body: "Contractor carries general liability and workers’ compensation insurance. Manufacturer warranties on shingles and accessories run from the manufacturer to the property owner per that manufacturer’s written terms. Those warranties are separate from Contractor’s workmanship warranty." },
      { heading: "8. Workmanship warranty", body: "Contractor warrants its workmanship for " + years + " year" + (years === 1 ? "" : "s") + " from the date of substantial completion against defects in installation. This warranty does not cover acts of God, hail, wind beyond the product rating, owner neglect, unauthorized repairs, or product fading/algae which are covered, if at all, by the manufacturer. Warranty is void if the account is not paid in full." },
      { heading: "9. Unforeseen decking and extras", body: "The estimate includes a sheathing replacement allowance as shown. Additional sheets, fascia, rafter, or ventilation work discovered after tear-off will be quoted before installation when reasonably possible. If Customer is unavailable and the condition is required to keep the roof watertight, Contractor may proceed and bill time and material at the rates then in effect." },
      { heading: "10. Photos", body: "Customer grants Contractor permission to photograph the property before, during, and after the work for documentation, insurance, and (unless Customer opts out in writing) portfolio use. Faces and addresses will not be used in advertising without additional consent." },
      { heading: "11. Entire agreement", body: "This Agreement, the attached estimate, and any written change orders are the entire agreement of the parties and supersede prior oral statements. If a court finds any provision unenforceable, the rest remains in force. This Agreement is governed by the laws of the state where the property is located." },
    ];
    return {
      title: IC.contractTitle(job),
      company: IC.companyBlock(settings),
      customerName: name,
      property: property,
      customerContact: contact,
      intro: settings.contractIntro,
      scope: IC.scopeLines(job, estimate),
      price: IC.money(total),
      payment: payment,
      articles: articles,
      projectNumber: String(job.number),
    };
  };
})(window.IC);
