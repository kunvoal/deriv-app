const lightMode = () => {
    const workspace = Blockly;
    // Root headers: deep twilight purple with muted tertiary lines
    workspace.Colours.RootBlock = {
        colour: '#5A3E8C',
        colourSecondary: '#5A3E8C',
        colourTertiary: '#8C84A4',
    };

    // Base (value reporters etc.): soft light purple base with white interiors
    workspace.Colours.Base = {
        colour: '#EAE4F8',
        colourSecondary: '#FFFFFF',
        colourTertiary: '#A6A1B7',
    };

    // Special1 (Before/Purchase etc.): light green accent to suggest action
    workspace.Colours.Special1 = {
        colour: '#E3F7E9',
        colourSecondary: '#FFFFFF',
        colourTertiary: '#9BD1AD',
    };

    // Special2 (Indicators/Tools secondary): soft orange
    workspace.Colours.Special2 = {
        colour: '#FFEEDD',
        colourSecondary: '#FFFFFF',
        colourTertiary: '#E6BFA3',
    };

    // Special3 (Notifications/Misc): light mint with subtle tertiary
    workspace.Colours.Special3 = {
        colour: '#E8FFF2',
        colourSecondary: '#FFFFFF',
        colourTertiary: '#A4D8BE',
    };

    // Special4 (Structural/advanced): warm grey with purple undertone
    workspace.Colours.Special4 = {
        colour: '#EFEFEF',
        colourSecondary: '#5A3E8C',
        colourTertiary: '#8C84A4',
    };
};

export const setColors = () => lightMode();
