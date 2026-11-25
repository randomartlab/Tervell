package art.randomai.proma;
import org.junit.Test;
import static org.junit.Assert.*;
public class ActivityPresentationTest {
 @Test public void policiesRetainManualOpenSemantics(){assertTrue(ActivityPresentation.expanded("expanded","completed"));assertFalse(ActivityPresentation.expanded("collapsed","running"));assertTrue(ActivityPresentation.expanded("balanced","running"));assertTrue(ActivityPresentation.expanded("balanced","failed"));assertFalse(ActivityPresentation.expanded("balanced","completed"));}
 @Test public void categoriesHaveReadableDifferentColors(){assertEquals("推理",ActivityPresentation.category("reasoning"));assertEquals("操作",ActivityPresentation.category("vendor_tool"));assertNotEquals(ActivityPresentation.color("reasoning","completed",false),ActivityPresentation.color("shell","completed",false));assertNotEquals(ActivityPresentation.color("read","failed",true),ActivityPresentation.color("read","completed",true));}
}
