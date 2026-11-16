import { Alert, Card, Meter, Progress, Skeleton, Spinner } from '../../index';

/** Alert in all variants and with its own icon, Progress, Meter, Spinner, Skeleton. */
export const FeedbackSection = () => (
    <Card title="Feedback" description="Alert, Progress, Meter, Spinner, Skeleton">
        <div className="sc-stack">
            <Alert title="Monorepo found">Choose the folder of the app before the analysis.</Alert>
            <Alert variant="success" title="Analysis finished">
                148 files, 37 components.
            </Alert>
            <Alert variant="warning" title="High complexity">
                3 components are above the threshold.
            </Alert>
            <Alert variant="danger" title="File could not be read">
                src/legacy/parser.js has a syntax error.
            </Alert>
            <Alert variant="warning" icon="device_hub">
                Inheritance should be avoided.
            </Alert>
            <div>
                <p className="sc-caption">Progress</p>
                <div className="sc-stack">
                    <Progress label="Analysis" value={64} />
                    <Progress label="Layout" />
                </div>
            </div>
            <div>
                <p className="sc-caption">Meter</p>
                <div className="sc-stack">
                    <Meter label="Disk" value={42} />
                    <Meter label="Lines of code" value={34} max={60} variant="success" />
                    <Meter label="Complexity" value={10} max={12} variant="warning" />
                    <Meter label="Parameters" value={25} max={1} variant="danger" />
                </div>
            </div>
            <div className="sc-row">
                <Spinner />
                <Spinner size={24} />
                <span className="sc-row" style={{ flex: 1, gap: 12 }}>
                    <Skeleton width={36} height={36} shape="circle" />
                    <span className="sc-stack" style={{ flex: 1, gap: 6 }}>
                        <Skeleton width="70%" height={12} />
                        <Skeleton width="45%" height={12} />
                    </span>
                </span>
            </div>
        </div>
    </Card>
);
