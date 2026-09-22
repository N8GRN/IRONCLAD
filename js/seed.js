window.IC = window.IC || {};

(function (IC) {
  IC.seedCustomers = function () {
    var t = function (daysAgo) {
      var d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString();
    };
    var c = function (first, last, phone, email, street, city, zip, daysAgo) {
      return {
        id: IC.uid(),
        firstName: first,
        lastName: last,
        phone: phone,
        email: email,
        street: street,
        city: city,
        state: "IN",
        zip: zip,
        notes: "",
        createdAt: t(daysAgo),
        updatedAt: t(daysAgo),
        seeded: true,
      };
    };
    return [
      c("Diane", "Halloway", "7655550142", "diane.halloway@example.com", "412 W Adams St", "Muncie", "47305", 18),
      c("Robert", "Chen", "7655550198", "rchen@example.com", "8800 N Wheeling Ave", "Muncie", "47303", 12),
      c("Maria", "Vasquez", "7655550110", "mvasquez@example.com", "219 S Franklin St", "Yorktown", "47396", 9),
      c("Tom", "Brennan", "7655550166", "tbrennan@example.com", "1540 N Morrison Rd", "Muncie", "47304", 6),
      c("Angela", "Pritchett", "7655550127", "apritchett@example.com", "67 Meadowbrook Ln", "Daleville", "47334", 3),
    ];
  };

  IC.seedJobs = function (customers) {
    var t = function (daysAgo) {
      var d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString();
    };
    var soon = function (days) {
      var d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };
    var diane = customers[0], robert = customers[1], maria = customers[2], tom = customers[3], angela = customers[4];
    var mk = function (number, customer, status, ownerId, ownerName, daysAgo, extra) {
      extra = extra || {};
      var est = IC.withComputed(IC.defaultEstimate(IC.SETTINGS), IC.SETTINGS);
      var job = {
        id: IC.uid(),
        number: number,
        customerId: customer.id,
        customerName: customer.firstName + " " + customer.lastName,
        status: status,
        ownerId: ownerId,
        ownerName: ownerName,
        crewId: extra.crewId != null ? extra.crewId : null,
        crewName: extra.crewName != null ? extra.crewName : null,
        scheduledDate: extra.scheduledDate != null ? extra.scheduledDate : null,
        includeRoof: true,
        includeGutters: extra.includeGutters || false,
        includeSiding: extra.includeSiding || false,
        price: extra.price != null ? extra.price : est.computed.total,
        notes: extra.notes || "",
        estimate: extra.estimate === null ? null : (extra.estimate || est),
        contract: extra.contract || null,
        createdAt: t(daysAgo),
        updatedAt: t(Math.max(0, daysAgo - 1)),
        createdBy: "nate",
        seeded: true,
      };
      return job;
    };

    var soldEst = IC.withComputed(Object.assign({}, IC.defaultEstimate(IC.SETTINGS), {
      structures: [Object.assign({}, IC.defaultEstimate(IC.SETTINGS).structures[0], {
        name: "House",
        squares: 28,
        level: "2-Story",
        pitch: "8/12 - 9/12",
        tearoff: "2-Layer",
      })],
      gutters: {
        included: true,
        description: "6 in seamless gutters, 4 downspouts, black",
        price: 2850,
      },
    }), IC.SETTINGS);

    return [
      mk(10014, diane, "Lead", "jon", "Jon", 2, {
        estimate: null,
        price: 0,
        notes: "Storm lead. Called after last week's hail.",
      }),
      mk(10015, robert, "Follow-up", "jesse", "Jesse", 8, {
        notes: "Sent photos. Waiting on HOA color approval.",
      }),
      mk(10016, maria, "Appointment", "jesse", "Jesse", 5, {
        notes: "Saturday 10am measure. Bring ladder.",
      }),
      mk(10017, tom, "Sold", "matt", "Matt", 11, {
        estimate: soldEst,
        price: soldEst.computed.total,
        includeGutters: true,
        notes: "Deposit collected. Needs contract signature.",
      }),
      mk(10018, angela, "Job Scheduled", "jon", "Jon", 14, {
        crewId: "crew-1",
        crewName: "Crew 1",
        scheduledDate: soon(3),
        notes: "Start Wednesday. Dumpster on the driveway.",
      }),
    ];
  };
})(window.IC);
