export const FLOW_TEMPLATES = [
  {
    id: "welcome",
    name: "Welcome Message",
    description: "Send a welcome message to new customers",
    triggerType: "lead_created",
    triggerConfig: { channel: "whatsapp" },
    steps: [
      {
        type: "send_message",
        config: {
          template: "welcome",
          variables: {},
        },
      },
    ],
  },
  {
    id: "booking_confirmation",
    name: "Booking Confirmation",
    description: "Confirm a booking with the customer",
    triggerType: "booking_created",
    triggerConfig: {},
    steps: [
      {
        type: "send_message",
        config: {
          template: "booking_confirmation",
          variables: {},
        },
      },
    ],
  },
];
