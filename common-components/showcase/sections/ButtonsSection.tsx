import {
    Avatar,
    Badge,
    Button,
    ButtonGroup,
    Card,
    Icon,
    IconProvider,
    type IconSet,
    Kbd,
    Separator,
    Spinner,
    Tooltip,
} from '../../index';

/** An own SVG icon in the text colour, as a host registers it. */
const ownIcons: IconSet = {
    sc_node: {
        viewBox: '0 0 24 24',
        content: (
            <>
                <circle cx={12} cy={12} r={9} fill="none" stroke="currentColor" strokeWidth={2} />
                <circle cx={12} cy={12} r={4} fill="currentColor" />
            </>
        ),
    },
};

/** Button, ButtonGroup, Tooltip on icon buttons, Badge, Kbd, Avatar. */
export const ButtonsSection = () => (
    <Card
        className="sc-wide"
        title="Buttons and labels"
        description="Button, ButtonGroup, Tooltip, Badge, Kbd, Avatar, Separator"
    >
        <div className="sc-stack">
            <div>
                <p className="sc-caption">Variants</p>
                <div className="sc-row">
                    <Button variant="primary">Analyze project</Button>
                    <Button variant="secondary">Export report</Button>
                    <Button variant="outline">Toggle cluster</Button>
                    <Button>Cancel</Button>
                    <Button variant="danger">Remove view</Button>
                    <Button variant="link">Open docs</Button>
                    <Button variant="primary" disabled>
                        Disabled
                    </Button>
                </div>
            </div>
            <div>
                <p className="sc-caption">Sizes, icons, loading</p>
                <div className="sc-row">
                    <Button variant="outline" size="sm">
                        Small
                    </Button>
                    <Button variant="outline">Medium</Button>
                    <Button variant="outline" size="lg">
                        Large
                    </Button>
                    <Button variant="primary">
                        <Icon name="upload_file" />
                        Browse folder
                    </Button>
                    <Button variant="secondary" disabled>
                        <Spinner size={14} label="Analyzing" />
                        Analyzing…
                    </Button>
                    <Separator orientation="vertical" />
                    <Tooltip text="Back to app graph">
                        <Button size="icon" aria-label="Back to app graph">
                            <Icon name="arrow_back" />
                        </Button>
                    </Tooltip>
                    <Tooltip text="Zoom to fit">
                        <Button size="icon" variant="outline" aria-label="Zoom to fit">
                            <Icon name="all_out" />
                        </Button>
                    </Tooltip>
                    <Tooltip text="Enter fullscreen">
                        <Button size="icon-sm" aria-label="Toggle fullscreen">
                            <Icon name="fullscreen" />
                        </Button>
                    </Tooltip>
                    <ButtonGroup label="Zoom">
                        <Button variant="outline" aria-label="Zoom out">
                            <Icon name="remove" />
                        </Button>
                        <Button variant="outline">100%</Button>
                        <Button variant="outline" aria-label="Zoom in">
                            <Icon name="add" />
                        </Button>
                    </ButtonGroup>
                </div>
            </div>
            <div>
                <p className="sc-caption">Icons: Material and own SVG icons (IconProvider)</p>
                <IconProvider icons={ownIcons}>
                    <div className="sc-row">
                        <Icon name="settings" />
                        <Icon name="settings" size={32} />
                        <Icon name="sc_node" />
                        <Icon name="sc_node" size={32} />
                        <Button variant="outline">
                            <Icon name="sc_node" />
                            Own icon
                        </Button>
                    </div>
                </IconProvider>
            </div>
            <div>
                <p className="sc-caption">Badges, keys, avatars</p>
                <div className="sc-row">
                    <Badge>Component</Badge>
                    <Badge variant="primary">12 nodes</Badge>
                    <Badge variant="outline">JSX</Badge>
                    <Badge variant="success">
                        <Icon name="check" />
                        OK
                    </Badge>
                    <Badge variant="warning">Warn</Badge>
                    <Badge variant="danger">Error</Badge>
                    <Separator orientation="vertical" />
                    <span className="sc-row">
                        <Kbd>Ctrl</Kbd>
                        <Kbd>K</Kbd>
                    </span>
                    <Separator orientation="vertical" />
                    <Avatar name="Ada Lovelace" />
                    <Avatar name="Qualivis" shape="square" />
                    <Avatar name="Grace Hopper" size={28} />
                </div>
            </div>
        </div>
    </Card>
);
